"use strict";

const db = require("../config/db");

class PostStorage {
    static async getPosts() {
        return new Promise((resolve, reject) => {
            const query = "SELECT * FROM posts";
            db.query(query, (err, data) => {
                if (err) reject(`${err}`);
                
                // report가 1인 게시글을 "차단된 게시글입니다"로 처리
                const processedPosts = data.map((post) => {
                    if (post.report === 1) {
                        post.title = "차단된 게시글입니다";
                        post.content = "차단된 게시글입니다";
                    }
                    return post;
                });
                
                resolve(processedPosts); // 처리된 게시글 데이터를 반환
            });
        });
    }

    // 특정 ID의 게시글을 가져오는 메소드
    static async getPostById(id) {
        return new Promise((resolve, reject) => {
            const query = "SELECT * FROM posts WHERE postnum = ?";
            db.query(query, [id], (err, data) => {
                if (err) {
                    console.error("Database error:", err);
                    return reject(`${err}`);
                }
                if (data.length === 0) {
                    console.log("No post found with postnum:", id);
                    return resolve(null);  // 게시글이 없을 때 처리
                }
                // report가 1이면 "차단된 메시지입니다"로 처리
            if (data[0].report === 1) {
                data[0].title = "차단된 게시글입니다";
                data[0].content = "차단된 게시글입니다";
                }
                resolve(data[0]); // 첫 번째 게시글 반환
            });
        });
    }
    
    

    // 새로운 게시글을 저장하는 메소드
    static async savePost(post) {
        return new Promise((resolve, reject) => {
            const query = "INSERT INTO posts (title, content, id) VALUES (?, ?, ?)";
            db.query(query, [post.title, post.content, post.id], (err, data) => {
                if (err) reject(`${err}`);
                resolve({ success: true }); // 성공적으로 저장되면 성공 응답 반환
            });
        });
    }

    // 특정 ID의 게시글을 삭제하는 메소드
    static async deletePost(postnum) {
        return new Promise((resolve, reject) => {
            const query = "DELETE FROM posts WHERE postnum = ?";
            db.query(query, [postnum], (err, data) => {
                if (err) reject(`${err}`);
                resolve({ success: true }); // 성공적으로 삭제되면 성공 응답 반환
            });
        });
    }
}

module.exports = PostStorage;
