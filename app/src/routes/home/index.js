"use strict";

const express = require("express");
const router = express.Router();
const ctrl = require("./home.ctrl");

// 라우트 정의
// 홈 화면 라우트
router.get("/", ctrl.output.home); // 홈 화면 출력

// 게시판 작성 화면 라우트
router.get("/board", ctrl.output.board); // 게시판 작성 화면 출력

// 로그인 화면 라우트
router.get("/login", ctrl.output.login); // 로그인 화면 출력

// 회원가입 화면 라우트
router.get("/register", ctrl.output.register); // 회원가입 화면 출력

// 게시글 상세보기 화면 라우트
router.get("/post_view", ctrl.output.postView); // 게시글 상세보기 출력

// 커뮤니티 화면 라우트
router.get("/community", ctrl.output.community); // 커뮤니티 화면 출력

// 쪽지 목록 화면 라우트
router.get("/message", ctrl.output.message); // 쪽지 목록 출력

// 쪽지 채팅 화면 라우트
router.get("/message_chat", ctrl.output.messageChat); // 쪽지 채팅 화면 출력

// 쪽지 전송 처리 라우트
router.post("/message/chat/send", ctrl.process.sendMessage); // 쪽지 전송 처리

// 게시글 상세보기 처리 라우트
router.get("/post/:id", ctrl.postDetail); // 특정 게시글 ID로 상세보기 처리

// 게시글 작성 처리 라우트
router.post("/board/write", ctrl.process.writePost); // 게시글 작성 처리

// 로그인 처리 라우트
router.post("/login", ctrl.process.login); // 로그인 처리

// 회원가입 처리 라우트
router.post("/register", ctrl.process.register); // 회원가입 처리

// 게시글 삭제 처리 라우트
router.delete("/delete-post/:postnum", ctrl.process.deletePost); // 게시글 삭제 처리

// 댓글 작성 처리 라우트
router.post("/post/:id/comment", ctrl.process.writeComment); // 특정 게시글 ID에 댓글 작성 처리

// 쪽지 목록 화면 라우트 (messageList 사용)
router.get("/message_list", ctrl.output.messageList); // 쪽지 목록 화면 출력

module.exports = router; // 라우터 모듈 내보내기
