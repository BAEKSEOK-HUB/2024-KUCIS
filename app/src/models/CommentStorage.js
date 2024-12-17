const db = require("../config/db");

class CommentStorage {
    // 댓글 저장 메서드
    static saveComment(comments) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO comments (comment, postnum, user_id, date, parent_id, ref)
                VALUES (?, ?, ?, NOW(), ?, ?)`;
            db.query(query, [
                comments.comment,
                comments.postnum,
                comments.user_id,
                comments.parent_id,
                comments.ref,
            ], (err, result) => {
                if (err) reject(`${err}`);
                resolve({ success: true });
            });
        });
    }

    // 특정 게시글의 댓글 가져오기
    static getCommentsByPostId(postnum) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT commentsID, postnum, user_id, parent_id, comment, date, ref, report
                FROM comments
                WHERE postnum = ?
                ORDER BY IF(parent_id IS NULL, commentsID, parent_id), date ASC
            `;

            db.query(query, [postnum], (err, results) => {
                if (err) {
                    console.error("댓글 조회 오류:", err);
                    return reject(err);
                }

                // report가 1인 댓글 처리
                const processedComments = results.map((comment) => {
                    if (comment.report === 1) {
                        return {
                            ...comment,
                            comment: "차단된 댓글입니다", // comment 내용 차단 메시지로 변경
                        };
                    }
                    return comment;
                });

                resolve(processedComments);
            });
        });
    }

    // 특정 댓글 가져오기
    static getCommentById(commentsID) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT commentsID, postnum, user_id, parent_id, comment, date, ref, report
                FROM comments 
                WHERE commentsID = ?`;

            db.query(query, [commentsID], (err, result) => {
                if (err) return reject(err);

                const comment = result[0];
                if (comment && comment.report === 1) {
                    comment.comment = "차단된 댓글입니다"; // report가 1인 경우 차단된 댓글 처리
                }

                resolve(comment);
            });
        });
    }
}

module.exports = CommentStorage;
