const db = require("../config/db");

class CommentStorage {
    static saveComment(comments) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO comments (comment, board_id, member_id, modify_regdate, date, answernum, parentnum, ref, step)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            db.query(query, [
                comments.comment,
                comments.board_id,
                comments.member_id,
                comments.modify_regdate,
                comments.date,
                comments.answernum,
                comments.parentnum,
                comments.ref,
                comments.step,
            ], (err, result) => {
                if (err) reject(`${err}`);
                resolve({ success: true });
            });
        });
    }

    static getProfaneCommentCount() {
        return new Promise((resolve, reject) => {
            const query = "SELECT COUNT(*) AS count FROM comments WHERE report = 1";
            db.query(query, (err, result) => {
                if (err) reject(err);
                resolve(result[0].count);
            });
        });
    }

    // CommentStorage.js
    static getProfaneComments() {
        return new Promise((resolve, reject) => {
            const query = `
            SELECT comments.comment, comments.commentsID AS commentId, comments.member_id AS author
            FROM comments
            WHERE comments.report = 1`;
            db.query(query, (err, results) => {
                if (err) reject(`${err}`);
                resolve(results);
            });
        });
    }



    static getCommentsByPostId(board_id) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM comments 
                WHERE board_id = ? 
                ORDER BY IF(parentnum = 0, commentsID, parentnum), date ASC
            `;
            db.query(query, [board_id], (err, results) => {
                if (err) reject(`${err}`);
                // report가 1인 댓글 처리
            const processedComments = results.map((comment) => {
                if (comment.report === 1) {
                    comment.comment = "차단된 댓글입니다";
                }
                return comment;
            });

            resolve(processedComments);
        });
    });
}    

    static getCommentById(commentsID) {
        return new Promise((resolve, reject) => {
            const query = "SELECT * FROM comments WHERE commentsID = ?";
            db.query(query, [commentsID], (err, result) => {
                if (err) reject(`${err}`);
                resolve(result[0]);
            });
        });
    }
}

module.exports = CommentStorage;