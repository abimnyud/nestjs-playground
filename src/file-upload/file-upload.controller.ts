import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Readable } from 'stream';
import { UserEvent } from './user-event.entity';
import axios from 'axios'
import { MulterCloudStorageFile, multerConfig } from 'src/config/multer-config';
import * as csvtojson from 'csvtojson';

@Controller('file-upload')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) { }

  // Buffer
  @Post('1')
  @UseInterceptors(FileInterceptor('file'))
  async fileUploadOne(@UploadedFile() file: Express.Multer.File) {
    const readableStream = new Readable({
      read(size) {
        this.push(file.buffer.subarray(0, size));
        file.buffer = file.buffer.subarray(size);
        if (file.buffer.length === 0) {
          this.push(null);
        }
      },
    });

    const res = await new Promise((resolve, reject) => {
      const results = [];
      let currentLine = '';

      readableStream.on('data', (chunk) => {
        const textChunk = chunk.toString();

        for (const char of textChunk) {
          if (char === '\n') {
            results.push(currentLine.split('\t').map((val) => val.trim().replace(/["\\]/g, "")));
            currentLine = '';
          } else {
            currentLine += char;
          }
        }
      });

      readableStream.on('end', () => {
        if (currentLine) {
          results.push(currentLine.split('\t').map((val) => val.trim().replace(/["\\]/g, "")));
        }

        // Remove header row
        results.shift();
        resolve(results);
      });

      readableStream.on('error', (error) => reject(error));
    });

    const keyColumn = [
      'name',
      'username',
      'email',
      'phoneNumber',
      'category',
      'location',
      'eventName',
      'team',
      'dateAdded'
    ]

    return (res as Array<any>).flatMap((item) => {
      const userEvent = new UserEvent;

      keyColumn.forEach((col, index) => {
        userEvent[col] = item[index + 1];
      })

      /**
       * Check if all properties is empty
       */
      if (Object.values(userEvent).every(x => x === null || x === '')) {
        return []
      }

      return userEvent
    })
  }

  // Axios + csvtojson
  @Post('2')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multerConfig()
    })
  )
  async fileUploadTwo(@UploadedFile() file: MulterCloudStorageFile) {
    const response = await axios.get(file.linkUrl);
    const jsonArray = await csvtojson({ delimiter: '\t' }).fromString(response.data);

    return jsonArray
  }

  // Fetch + extract manual
  @Post('3')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multerConfig()
    })
  )
  async fileUploadThree(@UploadedFile() file: MulterCloudStorageFile) {
    const res = await fetch(file.linkUrl)
      .then((res) => res.text())
      .then((stringText) =>
        stringText
          .split('\r\n')
          .slice(1)
          .map((row) =>
            row.split('\t').map((val) => val.trim().replace(/["\\]/g, ""))
          )
      );

    const keyColumn = [
      'name',
      'username',
      'email',
      'phoneNumber',
      'category',
      'location',
      'eventName',
      'team',
      'dateAdded'
    ]

    return (res as Array<Array<string>>).flatMap((item) => {
      const userEvent = new UserEvent;

      keyColumn.forEach((col, index) => {
        userEvent[col] = item[index + 1];
      })

      /**
       * Check if all properties is empty
       */
      if (Object.values(userEvent).every(x => x === null || x === '')) {
        return []
      }

      return userEvent
    })
  }
}
