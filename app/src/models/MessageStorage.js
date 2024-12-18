const db = require("../config/db");

class MessageStorage {
    // 메시지 리스트가 이미 존재하는지 확인
    static async checkMessageListExists(postnum, sender_id, reciver_id) {
        const [sortedsender_id, sortedreciver_id] = [sender_id, reciver_id].sort(); // 사용자 ID 정렬
        const query = `
            SELECT * FROM message_list 
            WHERE postnum = ? AND sender_id = ? AND reciver_id = ?
        `;
        // 조건에 맞는 메시지 리스트를 조회
        const [rows] = await db.promise().query(query, [postnum, sortedsender_id, sortedreciver_id]);
        return rows.length > 0; // 존재 여부 반환
    }

    // 메시지 리스트 저장
    static async saveMessageList({ postnum, sender_id, reciver_id }) {
        try {
            const [sortedsender_id, sortedreciver_id] = [sender_id, reciver_id]; // 사용자 ID 정렬
            const exists = await this.checkMessageListExists(postnum, sender_id, reciver_id); // 기존 리스트 확인
            if (exists) {
                return { success: false, message: "이미 존재하는 쪽지 리스트입니다." }; // 중복 확인
            }
            const query = `
                INSERT INTO message_list (postnum, sender_id, reciver_id, created_at)
                VALUES (?, ?, ?, NOW())
            `;
            // 새로운 메시지 리스트 저장
            const [result] = await db.promise().query(query, [postnum, sender_id, reciver_id]);
            return { success: true };
        } catch (err) {
            console.error("Error saving message list:", err);
            throw new Error("쪽지 리스트 저장 중 오류 발생");
        }
    }

    // 특정 채팅방의 메시지 가져오기
    static async getMessagesByRoomId(roomid) {
        const query = `
            SELECT 
                messageid, 
                roomid, 
                sender_id, 
                reciver_id, 
                content, 
                send_time,
                report 
            FROM 
                message 
            WHERE 
                roomid = ? 
            ORDER BY send_time ASC; -- 시간순 정렬
        `;
        try {
            // 채팅방에 속한 메시지 조회
            const [messages] = await db.promise().query(query, [roomid]);
            // report 값이 1인 메시지는 '차단된 메시지입니다'로 변경
            return messages.map((message) => ({
                ...message,
                content: message.report === 1 ? "차단된 메시지입니다" : message.content,
            }));
        } catch (err) {
            console.error("Error fetching messages by room ID:", err);
            throw err;
        }
    }

    // 특정 채팅방에서 상대방(reciver_id) 가져오기
    static async getReciverIdByRoomId(roomid, currentUser) {
        const query = `
            SELECT sender_id, reciver_id
            FROM message_list
            WHERE roomid = ?
        `;
        try {
            // 채팅방에서 상대방 ID 조회
            const [rows] = await db.promise().query(query, [roomid]);
            if (rows.length > 0) {
                const { sender_id, reciver_id } = rows[0];
                return sender_id === currentUser ? reciver_id : sender_id; // 상대방 ID 반환
            }
            throw new Error("No message data found for the given roomid.");
        } catch (err) {
            console.error("Error fetching reciver_id by room ID:", err);
            throw err;
        }
    }

    // 특정 게시글(postnum)에 속한 메시지 리스트 가져오기
    static async getMessagesByPostnum(postnum) {
        const query = `
            SELECT * 
            FROM message_list 
            WHERE postnum = ?
        `;
        try {
            // 게시글 번호를 기준으로 메시지 리스트 조회
            const [results] = await db.promise().query(query, [postnum]);
            return results;
        } catch (err) {
            console.error("Error fetching messages by postnum:", err);
            throw new Error("포스트 번호로 메시지 조회 중 오류 발생");
        }
    }

    // 새로운 메시지 생성
    static async createMessage(roomid, sender_id, content, report = 0) {
        try {
            // 채팅방에서 상대방 ID 가져오기
            const reciver_id = await this.getReciverIdByRoomId(roomid, sender_id);

            const query = `
                INSERT INTO message (roomid, send_time, sender_id, reciver_id, content, report)
                VALUES (?, NOW(), ?, ?, ?, ?)
            `;
            // 새로운 메시지 저장
            const [result] = await db.promise().query(query, [roomid, sender_id, reciver_id, content, report]);
            return result;
        } catch (err) {
            console.error("메시지 생성 오류:", err);
            throw new Error("메시지 생성 중 오류 발생");
        }
    }

    // 특정 사용자의 메시지 리스트 가져오기
    static async getMessagesForUser(userid) {
        const query = `
            SELECT 
                m.roomid, 
                m.sender_id, 
                m.reciver_id, 
                p.title AS post_title, 
                m.created_at
            FROM 
                message_list m
            JOIN 
                posts p 
            ON 
                m.postnum = p.postnum
            WHERE 
                m.sender_id = ? OR m.reciver_id = ?
            ORDER BY m.created_at DESC; -- 최신순 정렬
        `;
        try {
            // 특정 사용자가 보낸/받은 메시지 리스트 조회
            const [messages] = await db.promise().query(query, [userid, userid]);
            return messages;
        } catch (err) {
            console.error("Error fetching messages for user:", err);
            throw new Error("사용자 쪽지 리스트 조회 중 오류 발생");
        }
    }
}

module.exports = MessageStorage;
