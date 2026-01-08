import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import Bull from 'bull';
import redisClient from '../utils/redis.mjs';
import dbClient from '../utils/db.mjs';

const fileQueue = new Bull('fileQueue');

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      name, type, parentId = 0, isPublic = false, data,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    const acceptedTypes = ['folder', 'file', 'image'];
    if (!type || !acceptedTypes.includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if (!data && type !== 'folder') {
      return res.status(400).json({ error: 'Missing data' });
    }

    const filesCollection = dbClient.db.collection('files');

    if (parentId !== 0) {
      let parentObjectId;
      try {
        parentObjectId = new ObjectId(parentId);
      } catch (err) {
        return res.status(400).json({ error: 'Parent not found' });
      }

      const parentFile = await filesCollection.findOne({ _id: parentObjectId });

      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }

      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    const fileDocument = {
      userId: new ObjectId(userId),
      name,
      type,
      isPublic,
      parentId: parentId === 0 ? 0 : new ObjectId(parentId),
    };

    if (type === 'folder') {
      const result = await filesCollection.insertOne(fileDocument);

      return res.status(201).json({
        id: result.insertedId,
        userId,
        name,
        type,
        isPublic,
        parentId,
      });
    }

    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const filename = uuidv4();
    const localPath = path.join(folderPath, filename);

    const fileContent = Buffer.from(data, 'base64');
    fs.writeFileSync(localPath, fileContent);

    fileDocument.localPath = localPath;

    const result = await filesCollection.insertOne(fileDocument);

    if (type === 'image') {
      await fileQueue.add({
        userId,
        fileId: result.insertedId.toString(),
      });
    }

    return res.status(201).json({
      id: result.insertedId,
      userId,
      name,
      type,
      isPublic,
      parentId,
    });
  }

  static async getShow(req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    let fileObjectId;
    try {
      fileObjectId = new ObjectId(id);
    } catch (err) {
      return res.status(404).json({ error: 'Not found' });
    }

    const filesCollection = dbClient.db.collection('files');
    const file = await filesCollection.findOne({
      _id: fileObjectId,
      userId: new ObjectId(userId),
    });

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.status(200).json({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    });
  }

  static async getIndex(req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { parentId = '0', page = '0' } = req.query;
    const pageNum = parseInt(page, 10);
    const pageSize = 20;

    const filesCollection = dbClient.db.collection('files');

    let matchQuery;
    if (parentId === '0') {
      matchQuery = { userId: new ObjectId(userId), parentId: 0 };
    } else {
      try {
        matchQuery = { userId: new ObjectId(userId), parentId: new ObjectId(parentId) };
      } catch (err) {
        return res.status(200).json([]);
      }
    }

    const files = await filesCollection.aggregate([
      { $match: matchQuery },
      { $skip: pageNum * pageSize },
      { $limit: pageSize },
    ]).toArray();

    const result = files.map((file) => ({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    }));

    return res.status(200).json(result);
  }

  static async putPublish(req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    let fileObjectId;
    try {
      fileObjectId = new ObjectId(id);
    } catch (err) {
      return res.status(404).json({ error: 'Not found' });
    }

    const filesCollection = dbClient.db.collection('files');
    const file = await filesCollection.findOne({
      _id: fileObjectId,
      userId: new ObjectId(userId),
    });

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    await filesCollection.updateOne(
      { _id: fileObjectId },
      { $set: { isPublic: true } },
    );

    return res.status(200).json({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: true,
      parentId: file.parentId,
    });
  }

  static async putUnpublish(req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    let fileObjectId;
    try {
      fileObjectId = new ObjectId(id);
    } catch (err) {
      return res.status(404).json({ error: 'Not found' });
    }

    const filesCollection = dbClient.db.collection('files');
    const file = await filesCollection.findOne({
      _id: fileObjectId,
      userId: new ObjectId(userId),
    });

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    await filesCollection.updateOne(
      { _id: fileObjectId },
      { $set: { isPublic: false } },
    );

    return res.status(200).json({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: false,
      parentId: file.parentId,
    });
  }

  static async getFile(req, res) {
    const { id } = req.params;
    const { size } = req.query;

    let fileObjectId;
    try {
      fileObjectId = new ObjectId(id);
    } catch (err) {
      return res.status(404).json({ error: 'Not found' });
    }

    const filesCollection = dbClient.db.collection('files');
    const file = await filesCollection.findOne({ _id: fileObjectId });

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (!file.isPublic) {
      const token = req.headers['x-token'];

      if (!token) {
        return res.status(404).json({ error: 'Not found' });
      }

      const key = `auth_${token}`;
      const userId = await redisClient.get(key);

      if (!userId || userId !== file.userId.toString()) {
        return res.status(404).json({ error: 'Not found' });
      }
    }

    if (file.type === 'folder') {
      return res.status(400).json({ error: "A folder doesn't have content" });
    }

    let filePath = file.localPath;

    if (size) {
      const validSizes = ['500', '250', '100'];
      if (validSizes.includes(size)) {
        filePath = `${file.localPath}_${size}`;
      }
    }

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Not found' });
    }

    const mimeType = mime.lookup(file.name) || 'application/octet-stream';
    const fileContent = fs.readFileSync(filePath);

    res.setHeader('Content-Type', mimeType);
    return res.send(fileContent);
  }
}

export default FilesController;
