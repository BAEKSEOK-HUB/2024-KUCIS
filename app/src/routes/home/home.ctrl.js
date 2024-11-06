"use strict";

const User = require("../../models/User");
const PostStorage = require("../../models/PostStorage");
const MessageStorage = require("../../models/MessageStorage"); // MessageStorage를 불러옵니다.
const { formatTime } = require("../../public/js/home/time");
const path = require("path");
const fs = require("fs");
const { createObjectCsvWriter } = require("csv-writer");
const MessageExtractor = require("../../models/extractMessages"); // MessageExtractor를 불러옵니다.
const CommentStorage = require("../../models/CommentStorage"); // 댓글 작성 기능

const output = {
  home: async (req, res) => {
    try {
      // 비속어가 포함된 게시글, 댓글, 메시지의 수를 가져옴
      const profanePostCount = await PostStorage.getProfanePostCount();
      const profaneCommentCount = await CommentStorage.getProfaneCommentCount();
      const profaneMessageCount = await MessageStorage.getProfaneMessageCount();

      // 비속어가 포함된 게시글과 메시지의 목록을 가져옴
      const profanePosts = await PostStorage.getProfanePosts(); // 비속어 게시글 리스트
      const profaneMessages = await MessageStorage.getProfaneMessages(); // 비속어 메시지 리스트
      const profaneComments = await CommentStorage.getProfaneComments();

      res.render("home/index", {
        profanePostCount,
        profaneCommentCount,
        profaneMessageCount,
        profanePosts,
        profaneMessages,
        profaneComments
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("서버 오류 발생");
    }
  },
  profanePosts: async (req, res) => {
    try {
      const profanePosts = await PostStorage.getProfanePosts();
      res.render("home/profane_posts", { profanePosts });
    } catch (err) {
      console.error(err);
      res.status(500).send("서버 오류 발생");
    }
  },

  profaneComments: async (req, res) => {
    try {
      const profaneComments = await CommentStorage.getProfaneComments();
      res.render("home/profane_comments", { profaneComments });
    } catch (err) {
      console.error(err);
      res.status(500).send("서버 오류 발생");
    }
  },

  profaneMessages: async (req, res) => {
    try {
      const profaneMessages = await MessageStorage.getProfaneMessages();
      res.render("home/profane_messages", { profaneMessages });
    } catch (err) {
      console.error(err);
      res.status(500).send("서버 오류 발생");
    }
  },


  board: (req, res) => {
    res.render("home/board");
  },

  login: async (req, res) => {
    try {
        const profanePostCount = await PostStorage.getProfanePostCount();
        const profaneCommentCount = await CommentStorage.getProfaneCommentCount();
        const profaneMessageCount = await MessageStorage.getProfaneMessageCount();

        const profanePosts = await PostStorage.getProfanePosts(); // 비속어 게시글 리스트
        const profaneMessages = await MessageStorage.getProfaneMessages();
        const profaneComments = await CommentStorage.getProfaneComments();

        res.render("home/login", {
            profanePostCount,
            profaneCommentCount,
            profaneMessageCount,
            profanePosts,
            profaneMessages,
            profaneComments
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("서버 오류 발생");
    }
  },


  register: (req, res) => {
    res.render("home/register");
  },

  messageList: async (req, res) => {
    // 함수 이름을 messageList로 변경
    try {
      const { postnum, reciper, sender } = req.query;

      // 파라미터가 제대로 들어왔는지 로그로 확인
      console.log("postnum:", postnum);
      console.log("reciper:", reciper);
      console.log("sender:", sender);

      if (!sender) {
        return res.status(401).send("로그인이 필요합니다."); // 로그인되지 않은 경우 처리
      }

      // message_list에 해당 정보 저장
      const saveResult = await MessageStorage.saveMessageList({
        postnum,
        sender,
        reciper,
      });
      console.log("Message save result:", saveResult);

      const saveResults = await MessageStorage.saveMessageList({
        postnum,
        sender,
        reciper,
      });

      if (!saveResults.success && saveResults.message === "이미 존재하는 쪽지 리스트입니다.") {
        console.log("쪽지 리스트가 이미 존재하여 생성되지 않았습니다.");
      }

      // 해당 게시물의 쪽지 목록을 DB에서 가져옴
      const messages = await MessageStorage.getMessagesByPostnum(postnum);

      // 가져온 쪽지 데이터를 EJS에 전달하여 렌더링
      res.render("home/message", { messages, postnum, sender, reciper });
    } catch (err) {
      console.error("쪽지 생성 오류:", err); // 구체적인 오류를 콘솔에 출력
      res.status(500).send("서버 오류 발생");
    }
  },

  message: async (req, res) => {
    try {
      const userid = req.cookies.userid; // 쿠키에서 userid 값을 가져옴
      if (!userid) {
        return res.status(401).send("로그인이 필요합니다."); // 로그인되지 않은 경우 처리
      }

      const messages = await MessageStorage.getMessagesForUser(userid); // 해당 사용자의 쪽지 가져오기

      res.render("home/message", { messages }); // 가져온 쪽지 데이터를 EJS에 전달
    } catch (err) {
      console.error("쪽지 리스트 불러오기 오류:", err);
      res.status(500).send("서버 오류 발생");
    }
  },

  postView: async (req, res) => {
    try {
      const postId = req.params.id; // URL에서 postnum을 가져옴
      console.log("postId:", postId); // postId 값 출력 확인

      if (!postId) {
        console.log("No postId found in request"); // 추가된 디버깅 메시지
        return res.status(400).send("잘못된 요청입니다.");
      }

      // 게시글과 댓글을 가져옴
      const post = await PostStorage.getPostById(postId);
      const comments = await CommentStorage.getCommentsByPostId(postId);

      if (!post) {
        console.log("No post found for postId:", postId); // 추가된 디버깅 메시지
        return res.status(404).send("해당 게시글을 찾을 수 없습니다.");
      }

      // 게시글과 댓글을 함께 전달
      res.render("home/post_view", { post, comments });
    } catch (err) {
      console.error("게시글 조회 오류:", err);
      res.status(500).send("서버 오류 발생");
    }
  },

  community: async (req, res) => {
    try {
      const posts = await PostStorage.getPosts(); // 모든 게시글을 DB에서 가져옴
      res.render("home/community", { posts }); // 가져온 게시글 목록을 community.ejs에 전달
    } catch (err) {
      console.error(err);
      res.status(500).send("서버 오류 발생");
    }
  },

  messageChat: async (req, res) => {
    const roomid = req.query.roomid;
    const sender = req.cookies.userid;

    if (!roomid || !sender) {
      return res.status(400).send("잘못된 요청입니다.");
    }

    try {
      let messages = await MessageStorage.getMessagesByRoomId(roomid);

      const exportsDir = path.join(__dirname, "../../exports");
      if (!fs.existsSync(exportsDir)) {
        fs.mkdirSync(exportsDir, { recursive: true });
      }

      const csvFilePath = path.join(exportsDir, `messages_room_${roomid}.csv`);

      // CSV 데이터 작성 (BOM 추가)
      const csvHeaders = "보낸 사람,내용,보낸 시간\n";
      const csvData = messages
        .map((msg) => `${msg.sender},${msg.content},${msg.send_time}`)
        .join("\n");

      // UTF-8 BOM을 추가한 상태로 파일 저장
      fs.writeFileSync(csvFilePath, "\uFEFF" + csvHeaders + csvData, "utf8");

      // CSV 파일 다운로드 링크 제공
      res.render("home/message_chat", {
        messages,
        roomid,
        sender,
        csvDownloadLink: `/exports/messages_room_${roomid}.csv`,
      });
    } catch (err) {
      console.error("메시지 조회/생성 오류:", err);
      res.status(500).send("서버 오류 발생");
    }
  },
};

const process = {
  login: async (req, res) => {
    const user = new User(req.body); // 로그인 요청 데이터를 기반으로 User 객체 생성
    const response = await user.login(); // 로그인 처리

    const url = {
      method: "POST",
      path: "/login",
      status: response.err ? 400 : 200,
    };

    return res.json(response); // 로그인 결과를 클라이언트에 반환
  },

  register: async (req, res) => {
    const user = new User(req.body); // 회원가입 요청 데이터를 기반으로 User 객체 생성
    const response = await user.register(); // 회원가입 처리

    const url = {
      method: "POST",
      path: "/register",
      status: response.err ? 409 : 201,
    };
    return res.json(response); // 회원가입 결과를 클라이언트에 반환
  },

  writePost: async (req, res) => {
    try {
      const { title, content } = req.body; // 클라이언트에서 전송된 게시글 제목과 내용
      const id = req.cookies.userid;
      const post = { title, content, id }; // 게시글 데이터 구성

      await PostStorage.savePost(post); // 게시글을 DB에 저장
      res.json({ success: true }); // 게시글 작성 후 게시글 목록으로 리다이렉트
    } catch (err) {
      console.error("게시글 작성 오류:", err);
      res.status(500).send("게시글 작성 실패"); // 오류 발생 시 에러 메시지 출력
    }
  },

  deletePost: async (req, res) => {
    try {
      const postId = req.params.postnum; // URL에서 삭제할 게시글의 postnum을 가져옴
      console.log("Deleting post with postnum:", postId); // 로그 추가
      await PostStorage.deletePost(postId); // 해당 postnum의 게시글을 삭제
      res.json({ success: true }); // 삭제 성공 시 JSON 형식으로 응답
    } catch (err) {
      console.error("게시글 삭제 오류:", err);
      res.status(500).json({ success: false, message: "게시글 삭제 실패" }); // 삭제 실패 시 오류 메시지 반환
    }
  },

  sendMessage: async (req, res) => {
    const { roomid, content } = req.body;
    const sender = req.cookies.userid; // 로그인한 사용자 ID 가져오기

    // 필수 값 체크
    if (!content || !roomid || !sender) {
      return res.status(400).send("메시지 내용 또는 방 ID가 누락되었습니다.");
    }

    try {
      const postnum = 1; // 현재 포스트 번호를 실제로 설정해야 합니다.

      // reciper를 message_list에서 찾기
      const reciper = await MessageStorage.getReciperByRoomId(roomid, sender);

      // DB에 메시지 저장
      await MessageStorage.createMessage(roomid, postnum, sender, content);

      // 저장 후 해당 채팅방으로 리다이렉트
      res.redirect(`/message_chat?roomid=${roomid}`); // URL 수정: /message_chat -> /message/chat
    } catch (err) {
      console.error("메시지 저장 오류:", err);
      res.status(500).send("서버 오류 발생");
    }
  },

  extractMessages: async (req, res) => {
    const messageExtractor = new MessageExtractor(req.body); // POST 요청으로 들어온 데이터 처리
    const result = await messageExtractor.extract();
    if (result.success) {
      return res.download(result.filePath); // 성공 시 CSV 파일 다운로드
    } else {
      return res.status(400).send(result.msg); // 실패 시 오류 메시지 반환
    }
  },

  writeComment: async (req, res) => {
    try {
      const { comment, parentnum } = req.body; // 클라이언트에서 전송된 댓글 내용과 부모 댓글 번호
      const postnum = req.params.id; // URL에서 게시글 번호를 가져옴
      const member_id = req.cookies.userid; // 현재 로그인한 사용자 ID를 쿠키에서 가져옴

      let ref;

      // 대댓글인 경우 상위 댓글의 ref 값을 상속받음
      if (parentnum && parentnum !== "0") {
        const parentComment = await CommentStorage.getCommentById(parentnum);
        ref = parentComment ? parentComment.ref : postnum; // 상위 댓글의 ref 값 사용
      } else {
        // 일반 댓글인 경우 게시글 번호를 ref로 설정
        ref = postnum;
      }

      // 댓글 데이터 구성
      const commentData = {
        comment: comment,
        board_id: postnum, // 게시글 ID
        member_id: member_id, // 댓글 작성자 ID
        modify_regdate: new Date(), // 수정 날짜
        date: new Date(), // 작성 날짜
        answernum: 0, // 기본값으로 설정 (답글 구조일 경우 변경)
        parentnum: parentnum || 0, // 부모 댓글 번호가 없으면 0
        ref: ref, // ref 값 설정 (상위 댓글이 있으면 상위 댓글의 ref, 없으면 게시글 번호)
        step: 0, // 기본값으로 설정
      };

      // 댓글 저장 로직 (CommentStorage의 saveComment 함수 사용)
      await CommentStorage.saveComment(commentData);

      // 댓글 작성 후 해당 게시글로 리다이렉트
      res.redirect(`/post/${postnum}`);
    } catch (err) {
      console.error("댓글 작성 오류:", err);
      res.status(500).send("댓글 작성 실패");
    }
  },
};

const postDetail = async (req, res) => {
  try {
    const postId = req.params.id; // URL에서 게시글 ID를 가져옴
    const post = await PostStorage.getPostById(postId); // 게시글 정보를 DB에서 가져옴
    const comments = await CommentStorage.getCommentsByPostId(postId); // 해당 게시글의 댓글을 DB에서 가져옴

    if (!post) {
      return res.status(404).send("해당 게시글을 찾을 수 없습니다.");
    }

    // 부모 댓글과 대댓글을 분리
    const parentComments = comments.filter(
      (comment) => parseInt(comment.parentnum) === 0
    ); // parentnum을 숫자로 변환하여 비교
    const replies = comments.filter(
      (comment) => parseInt(comment.parentnum) !== 0
    );

    // 댓글과 대댓글을 EJS 템플릿으로 전달
    res.render("home/post_view", { post, parentComments, replies });
  } catch (err) {
    console.error("게시글 조회 오류:", err);
    res.status(500).send("서버 오류 발생");
  }
};

module.exports = {
  output,
  process,
  postDetail, // 게시글 조회 함수
};
