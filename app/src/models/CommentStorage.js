const db = require("../config/db");

class CommentStorage {
    // 댓글 저장 메서드
    // 새로운 댓글 데이터를 comments 테이블에 저장
    static saveComment(comments) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO comments (comment, postnum, user_id, date, parent_id, ref)
                VALUES (?, ?, ?, NOW(), ?, ?)`;
            db.query(query, [
                comments.comment,     // 댓글 내용
                comments.postnum,     // 댓글이 속한 게시글 번호
                comments.user_id,     // 작성자의 ID
                comments.parent_id,   // 부모 댓글 ID (대댓글인 경우)
                comments.ref,         // 참조 값
            ], (err, result) => {
                if (err) reject(`${err}`); // 오류 발생 시 예외 처리
                resolve({ success: true }); // 성공 시 결과 반환
            });
        });
    }

    // 특정 게시글의 댓글 가져오기
    // 주어진 게시글(postnum)에 속한 모든 댓글을 조회
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
                    return reject(err); // 오류 발생 시 예외 처리
                }

                // report가 1인 댓글 처리
                // report가 1인 댓글은 "차단된 댓글입니다"로 내용을 변경
                const processedComments = results.map((comment) => {
                    if (comment.report === 1) {
                        return {
                            ...comment,
                            comment: "차단된 댓글입니다", // comment 내용 차단 메시지로 변경
                        };
                    }
                    return comment; // 차단되지 않은 댓글은 그대로 반환
                });

                resolve(processedComments); // 최종 댓글 목록 반환
            });
        });
    }

    // 특정 댓글 가져오기
    // commentsID를 기준으로 특정 댓글 하나를 조회
    static getCommentById(commentsID) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT commentsID, postnum, user_id, parent_id, comment, date, ref, report
                FROM comments 
                WHERE commentsID = ?`;

            db.query(query, [commentsID], (err, result) => {
                if (err) return reject(err); // 오류 발생 시 예외 처리

                const comment = result[0]; // 조회된 댓글 데이터
                // report가 1인 경우 차단된 댓글로 처리
                if (comment && comment.report === 1) {
                    comment.comment = "차단된 댓글입니다"; 
                }

                resolve(comment); // 최종 댓글 데이터 반환
            });
        });
    }
}

module.exports = CommentStorage;
