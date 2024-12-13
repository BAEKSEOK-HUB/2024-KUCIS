"use strict";

const MessageStorage = require("./MessageStorage");
const path = require("path");
const fs = require("fs");
const { createObjectCsvWriter } = require("csv-writer");

class MessageExtractor {
  constructor(body) {
    this.body = body;
  }

  async extract() {
    const { roomid } = this.body;
    if (!roomid) {
      return { success: false, msg: "Room ID가 누락되었습니다." };
    }

    try {
      const messages = await MessageStorage.getMessagesByRoomId(roomid);
      if (!messages || messages.length === 0) {
        return {
          success: false,
          msg: "해당 Room ID에 대한 메시지가 없습니다.",
        };
      }

      const exportsDir = path.join(__dirname, "../exports");
      if (!fs.existsSync(exportsDir)) {
        fs.mkdirSync(exportsDir, { recursive: true });
      }

      const csvFilePath = path.join(exportsDir, `messages_room_${roomid}.csv`);

      const csvWriter = createObjectCsvWriter({
        path: csvFilePath,
        header: [
          { id: "sender_id", title: "보낸 사람" },
          { id: "content", title: "내용" },
          { id: "send_time", title: "보낸 시간" },
        ],
      });

      await csvWriter.writeRecords(messages);

      return { success: true, filePath: csvFilePath };
    } catch (err) {
      return { success: false, msg: err.message };
    }
  }
}

module.exports = MessageExtractor;
