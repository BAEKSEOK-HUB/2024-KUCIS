"use strict";

// 필요한 모델과 모듈 불러오기
const User = require("../../models/User");
const PostStorage = require("../../models/PostStorage");
const MessageStorage = require("../../models/MessageStorage"); // MessageStorage를 불러옵니다.
const { formatTime } = require("../../public/js/home/time");
const path = require("path");
const fs = require("fs");
const CommentStorage = require("../../models/CommentStorage"); // 댓글 작성 기능

// 화면 출력 관련 기능
const output = {
  // 홈 화면 출력
  home: (req, res) => {
    res.render("home/index");
  },

  // 게시판 화면 출력
  board: (req, res) => {
    res.render("home/board");
  },

  // 로그인 화면 출력
  login: (req, res) => {
    res.render("home/login");
  },

  // 회원가입 화면 출력
  register: (req, res) => {
    res.render("home/register");
  },

  // 쪽지 리스트 조회 및 저장
  messageList: async (req, res) => {
    try {
      const { postnum, sender_id } = req.query;

      console.log("postnum:", postnum);
      console.log("sender_id:", sender_id);

      // 로그인 여부 확인
      if (!sender_id) {
        return res.status(401).send("로그인이 필요합니다."); // 로그인되지 않은 경우 처리
      }

      // 게시글 작성자의 ID를 가져옴
      const post = await PostStorage.getPostById(postnum);
      if (!post) {
        return res.status(404).send("게시글을 찾을 수 없습니다.");
      }
      console.log("Post data:", post);

      const reciver_id = post.id; // 게시글 작성자의 ID를 'id' 필드에서 가져옴
      if (!reciver_id) {
        throw new Error("게시글 작성자 ID(reciver_id)가 없습니다.");
      }

      // message_list 테이블에 데이터 저장
      const saveResult = await MessageStorage.saveMessageList({
        postnum,
        sender_id,
        reciver_id,
      });
      console.log("Message save result:", saveResult);

      // 해당 게시물의 쪽지 목록을 DB에서 가져옴
      const messages = await MessageStorage.getMessagesByPostnum(postnum);

      // 쪽지 데이터를 EJS에 전달하여 화면 렌더링
      res.render("home/message", { messages, postnum, sender_id, reciver_id });
    } catch (err) {
      console.error("쪽지 생성 오류:", err); // 오류 로그 출력
      res.status(500).send(err.message);
    }
  },

  // 쪽지 리스트 삭제
  deletemessagelist: async (req, res) => {
    const { roomid } = req.params; // URL에서 roomid를 가져옴

    if (!roomid) {
      return res.status(400).send("roomid가 필요합니다."); // 요청 검증
    }

    try {
      const result = await MessageStorage.deletemessagelist(roomid); // 삭제 메서드 호출
      res.status(200).json(result); // 삭제 성공 시 응답
    } catch (err) {
      console.error("쪽지 리스트 삭제 오류:", err);
      res.status(500).send(err.message);
    }
  },

  // 사용자 쪽지 리스트 화면 출력
  message: async (req, res) => {
    try {
      const userid = req.cookies.userid; // 쿠키에서 userid 값을 가져옴
      if (!userid) {
        return res.status(401).send("로그인이 필요합니다."); // 로그인되지 않은 경우 처리
      }

      const messages = await MessageStorage.getMessagesForUser(userid); // 사용자의 쪽지 데이터 가져오기
      res.render("home/message", { messages }); // 쪽지 데이터를 EJS에 전달
    } catch (err) {
      console.error("쪽지 리스트 불러오기 오류:", err);
      res.status(500).send("서버 오류 발생");
    }
  },

  // 게시글 상세보기 화면 출력
  postView: async (req, res) => {
    try {
      const postId = req.params.id; // URL에서 postnum을 가져옴
      console.log("postId:", postId);

      if (!postId) {
        return res.status(400).send("잘못된 요청입니다."); // 잘못된 요청 처리
      }

      // 게시글과 댓글 데이터를 가져옴
      const post = await PostStorage.getPostById(postId);
      const comments = await CommentStorage.getCommentsByPostId(postId);

      if (!post) {
        return res.status(404).send("해당 게시글을 찾을 수 없습니다."); // 게시글이 없는 경우
      }

      res.render("home/post_view", { post, comments }); // 게시글과 댓글 데이터를 전달
    } catch (err) {
      console.error("게시글 조회 오류:", err);
      res.status(500).send("서버 오류 발생");
    }
  },

  // 게시판 화면 출력
  community: async (req, res) => {
    try {
      const posts = await PostStorage.getPosts(); // 게시글 목록을 가져옴
      res.render("home/community", { posts }); // EJS에 게시글 데이터 전달
    } catch (err) {
      console.error(err);
      res.status(500).send("서버 오류 발생");
    }
  },

  // 채팅방 화면 출력
  messageChat: async (req, res) => {
    const roomid = req.query.roomid;
    const sender_id = req.cookies.userid;

    if (!roomid || !sender_id) {
      return res.status(400).send("잘못된 요청입니다.");
    }

    try {
      const messages = await MessageStorage.getMessagesByRoomId(roomid); // 채팅방 메시지 조회
      res.render("home/message_chat", { messages, roomid, sender_id });
    } catch (err) {
      console.error("메시지 조회/생성 오류:", err);
      res.status(500).send("서버 오류 발생");
    }
  },
};

// 데이터 처리 관련 기능
const process = {
  // 로그인 처리
  login: async (req, res) => {
    const user = new User(req.body); // 클라이언트에서 받은 로그인 데이터를 기반으로 User 객체 생성
    const response = await user.login(); // User 모델의 login 메서드 호출
    return res.json(response); // 로그인 결과를 JSON 형태로 클라이언트에 반환
  },

  // 회원가입 처리
  register: async (req, res) => {
    const user = new User(req.body); // 클라이언트에서 받은 회원가입 데이터를 기반으로 User 객체 생성
    const response = await user.register(); // User 모델의 register 메서드 호출
    return res.json(response); // 회원가입 결과를 JSON 형태로 클라이언트에 반환
  },

  // 게시글 작성
  writePost: async (req, res) => {
    try {
      const { title, content } = req.body; // 클라이언트에서 게시글 제목과 내용 데이터를 추출
      const id = req.cookies.userid; // 쿠키에서 로그인된 사용자 ID를 가져옴
      const post = { title, content, id }; // 게시글 데이터를 객체로 구성
      await PostStorage.savePost(post); // PostStorage 모델을 사용해 게시글을 DB에 저장
      res.json({ success: true }); // 성공 시 JSON 형태의 성공 메시지 반환
    } catch (err) {
      console.error("게시글 작성 오류:", err); // 에러 발생 시 콘솔에 오류 출력
      res.status(500).send("게시글 작성 실패"); // 서버 오류 메시지 반환
    }
  },

  // 게시글 삭제
  deletePost: async (req, res) => {
    try {
      const postId = req.params.postnum; // URL 파라미터에서 삭제할 게시글 번호를 가져옴
      await PostStorage.deletePost(postId); // PostStorage 모델의 deletePost 메서드를 호출하여 게시글 삭제
      res.json({ success: true }); // 성공적으로 삭제되면 JSON 형태로 성공 메시지 반환
    } catch (err) {
      console.error("게시글 삭제 오류:", err); // 에러 발생 시 콘솔에 오류 출력
      res.status(500).json({ success: false, message: "게시글 삭제 실패" }); // 실패 메시지 반환
    }
  },

  // 메시지 전송 처리
  sendMessage: async (req, res) => {
    const { roomid, content } = req.body; // 클라이언트에서 메시지 내용과 채팅방 ID를 가져옴
    const sender_id = req.cookies.userid; // 쿠키에서 로그인한 사용자 ID를 가져옴

    if (!content || !roomid || !sender_id) {
      return res.status(400).send("메시지 내용 또는 방 ID가 누락되었습니다."); // 필수 데이터 누락 시 에러 반환
    }

    try {
      const report = 0; // 기본적으로 메시지 상태를 정상(0)으로 설정
      await MessageStorage.createMessage(roomid, sender_id, content, report); // 메시지 저장 메서드 호출
      res.redirect(`/message_chat?roomid=${roomid}`); // 메시지 저장 후 해당 채팅방으로 리다이렉트
    } catch (err) {
      console.error("메시지 저장 오류:", err); // 저장 오류 발생 시 콘솔에 출력
      res.status(500).send("서버 오류 발생"); // 서버 오류 메시지 반환
    }
  },

  // 댓글 작성 처리
  writeComment: async (req, res) => {
    try {
      const { comment, parent_id } = req.body; // 클라이언트에서 댓글 내용과 부모 댓글 ID 가져옴
      const postnum = req.params.id; // URL 파라미터에서 게시글 ID를 가져옴
      const user_id = req.cookies.userid; // 쿠키에서 댓글 작성자 ID 가져옴

      let ref; // 댓글의 참조값을 설정 (일반 댓글 또는 대댓글 구분)

      if (parent_id && parent_id !== "0") {
        // 대댓글인 경우
        const parentComment = await CommentStorage.getCommentById(parent_id); // 부모 댓글 정보를 가져옴
        ref = parentComment ? parentComment.ref : postnum; // 부모 댓글의 ref 값을 상속
      } else {
        // 일반 댓글인 경우
        ref = postnum; // 참조값을 게시글 ID로 설정
      }

      const commentData = {
        comment, // 댓글 내용
        postnum, // 댓글이 속한 게시글 ID
        user_id, // 댓글 작성자 ID
        date: new Date(), // 현재 날짜와 시간
        parent_id: parent_id || 0, // 부모 댓글 ID가 없으면 0으로 설정
        ref, // 참조값 설정
      };

      await CommentStorage.saveComment(commentData); // 댓글을 DB에 저장
      res.redirect(`/post/${postnum}`); // 댓글 작성 후 해당 게시글 페이지로 리다이렉트
    } catch (err) {
      console.error("댓글 작성 오류:", err); // 오류 발생 시 콘솔에 출력
      res.status(500).send("댓글 작성 실패"); // 서버 오류 메시지 반환
    }
  },
};

// 게시글 상세 조회
const postDetail = async (req, res) => {
  try {
    const postId = req.params.id; // URL 파라미터에서 게시글 ID 가져오기
    const post = await PostStorage.getPostById(postId); // 게시글 데이터를 DB에서 조회
    const comments = await CommentStorage.getCommentsByPostId(postId); // 해당 게시글의 댓글 데이터를 조회

    if (!post) {
      return res.status(404).send("해당 게시글을 찾을 수 없습니다."); // 게시글이 존재하지 않으면 404 반환
    }

    // 부모 댓글과 대댓글을 분리
    const parentComments = comments.filter(
      (comment) => parseInt(comment.parent_id) === 0
    ); // parent_id가 0인 댓글은 부모 댓글로 처리
    const replies = comments.filter(
      (comment) => parseInt(comment.parent_id) !== 0
    ); // parent_id가 0이 아닌 댓글은 대댓글로 처리

    // 게시글, 부모 댓글, 대댓글 데이터를 함께 EJS에 전달
    res.render("home/post_view", { post, parentComments, replies });
  } catch (err) {
    console.error("게시글 조회 오류:", err); // 오류 발생 시 콘솔에 출력
    res.status(500).send("서버 오류 발생"); // 서버 오류 메시지 반환
  }
};

// 모듈로 내보내기
module.exports = {
  output,
  process,
  postDetail,
};
