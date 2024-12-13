const db = require("../config/db");

class CommentStorage {
    static saveComment(comments) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO comments (comment, postnum, user_id, date, parent_id, ref)
                VALUES (?, ?, ?, ?, ?, ?)`;
            db.query(query, [
                comments.comment,
                comments.postnum,
                comments.user_id,
                comments.date,
                comments.parent_id,
                comments.ref,
            ], (err, result) => {
                if (err) reject(`${err}`);
                resolve({ success: true });
            });
        });
    }

    static getCommentsByPostId(postnum) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM comments 
                WHERE postnum = ? 
                ORDER BY IF(parent_id = 0, commentsID, parent_id), date ASC
            `;
            db.query(query, [postnum], (err, results) => {
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