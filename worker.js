import Bull from 'bull';
import { ObjectId } from 'mongodb';
import imageThumbnail from 'image-thumbnail';
import fs from 'fs';
import dbClient from './utils/db.mjs';

const fileQueue = new Bull('fileQueue');

fileQueue.process(async (job) => {
  const { fileId, userId } = job.data;

  if (!fileId) {
    throw new Error('Missing fileId');
  }

  if (!userId) {
    throw new Error('Missing userId');
  }

  const filesCollection = dbClient.db.collection('files');

  let fileObjectId;
  try {
    fileObjectId = new ObjectId(fileId);
  } catch (err) {
    throw new Error('File not found');
  }

  const file = await filesCollection.findOne({
    _id: fileObjectId,
    userId: new ObjectId(userId),
  });

  if (!file) {
    throw new Error('File not found');
  }

  const sizes = [500, 250, 100];

  for (const width of sizes) {
    try {
      const thumbnail = await imageThumbnail(file.localPath, { width });
      const thumbnailPath = `${file.localPath}_${width}`;
      fs.writeFileSync(thumbnailPath, thumbnail);
    } catch (err) {
      console.error(`Error generating thumbnail ${width}: ${err.message}`);
    }
  }
});

console.log('Worker started...');
