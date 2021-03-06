import React, { useContext, useEffect, useState } from "react";
import styled, { css } from "styled-components";
import PinImg from "../../imgs/pin.svg";
import { useParams } from "react-router-dom";
import DraftTextArea from "../common/DraftTextArea";
import { UserContext } from "../context/UserProvider";
import { useHistory } from "react-router-dom";
import Reaction from "../common/Reaction";
import Button from "../common/Button";
import LazyFetch from "../common/requests/LazyFetch";
import InstructorIcon from "../../imgs/instructor.svg";
import CommentImg from "../../imgs/comment.svg";
import Checkbox from "../common/Checkbox";
import Icon from "../common/Icon";
import OptionDots from "../../imgs/option-dots.svg";
import Dropdown from "../common/dropdown/Dropdown";

// Checks props to determine if the post is a draft, isPinned, etc.
const generatePostContent = (
  user,
  post,
  isDraft,
  handleChange,
  handleSubmit,
  postid,
  isAnon,
  isPriv
) => {
  // If a post is passed, set all dynamic content accordingly, otherwise render a draft
  if (isDraft) {
    return {
      title: (
        <DraftTextArea
          minRows={1}
          placeholder="Post title"
          onChange={handleChange}
          name="title"
        />
      ),
      content: (
        <DraftTextArea
          secondary
          placeholder="Details"
          onChange={handleChange}
          name="content"
        />
      ),
      to: null,
      isInstructor: false,
      isPinned: false,
      picture: user.picture,
      postedBy: user.first + " " + user.last,
      meta: (
        <Button primary onClick={handleSubmit}>
          Submit
        </Button>
      ),
      isAnonymous: (
        <Checkbox
          checkboxName="isAnonymous"
          labelText={"Make Anonymous"}
          onChange={handleChange}
          checkStatus={isAnon}
        />
      ),
      isPrivate: (
        <Checkbox
          checkboxName="isPrivate"
          labelText={"Make Private"}
          onChange={handleChange}
          checkStatus={isPriv}
        />
      ),
    };
  } else {
    return {
      title: post.title,
      content: post.content,
      to: {
        pathname: "/course/" + post.courseId + "/post/" + post._id,
        state: { post },
      },
      isInstructor: post.isInstructor,
      isPinned: post.isPinned,
      picture: post.postedBy.picture,
      postedBy: post.postedBy.first + " " + post.postedBy.last,
      meta: (
        <>
          <Reaction
            reactions={post.reactions}
            type="post"
            id={post._id}
            postid={postid}
          />
          <Icon
            alt={"Number of comments"}
            src={CommentImg}
            width={"18px"}
            style={{
              float: "left",
              marginRight: "8px",
              marginLeft: "20px",
              userSelect: "none",
            }}
          />
          <h5 style={{ color: "#8c8c8c" }}>{post.comments}</h5>
        </>
      ),
    };
  }
};

/**
 * Post ~ Blueprint for displaying Posts of various types.
 *
 * @param {string} post idk what this does tbh
 * @param {bool} isCondensed tells the post whether to display completely or condensed
 * @param {bool} isDraft tells the post whether to display as a form to fill out or not
 */
const Post = ({ userRole, post, isCondensed, isDraft }) => {
  const history = useHistory();
  const user = useContext(UserContext);
  const { courseId, postid } = useParams();
  let endpoint = "/courses/" + courseId + "/posts";

  // State and handler for drafting posts
  const [draft, setDraft] = useState({
    title: "",
    content: "",
    isAnonymous: false,
    isPrivate: false,
  });

  const handleChange = (e) => {
    setDraft({
      ...draft,
      [e.target.name]:
        e.target.type === "checkbox" ? e.target.checked : e.target.value,
    });
  };

  const handleSubmit = (e) => {
    LazyFetch({
      type: "post",
      endpoint: endpoint,
      data: {
        title: draft.title,
        content: draft.content,
        isPrivate: draft.isPrivate,
        isAnonymous: draft.isAnonymous,
      },
      onSuccess: (data) => {
        /* data.new is used after the redirect to prevent 
        a request for comments (new posts have 0 comments)*/
        data.new = true;
        history.push({
          pathname: "/course/" + data.courseId + "/post/" + data._id,
          state: { post: data },
        });
      },
    });
  };

  if (draft != null) {
    var isAnon = draft.isAnonymous;
    var isPriv = draft.isPrivate;
  } else {
    isAnon = false;
    isPriv = false;
  }

  // Determines if post is a draft or not and renders accordingly:
  let render = generatePostContent(
    user,
    post,
    isDraft,
    handleChange,
    handleSubmit,
    postid,
    isAnon,
    isPriv
  );

  // Handles redirect if the post is not a draft
  const navigateToPost = () => {
    if (render.to) {
      history.push(render.to);
    }
  };

  const handleDelete = () => {
    LazyFetch({
      type: "delete",
      endpoint: endpoint,
      data: { _id: postid },
      onSuccess: (data) => {
        let path = "/course/" + courseId;
        history.push(path);
      },
    });
  };

  const handleEdit = () => {
    alert("This feature is still a work in progress. Check back soon!");
  };

  const options = [
    { onClick: handleDelete, label: "Delete post" },
    { onClick: handleEdit, label: "Edit post" },
  ];

  // Initialize viewOptions to see if a user should be able to see dropdown options
  var viewOptions = false;
  // Check to see if the user is an admin
  for (let i = 0; i < user.courses.length; i++) {
    if (user?.courses[i].courseId == courseId) {
      viewOptions = user.courses[i].admin;
    }
  }
  // Check to see if the user made the post
  if (
    !isDraft &&
    (post.postedBy._id == user._id || post.postedBy._id == user.anonymousId)
  ) {
    viewOptions = true;
  }

  return (
    <PostWrapper
      isCondensed={isCondensed}
      isFocused={postid}
      onClick={navigateToPost}
    >
      <TopSection>
        <PostTitle isCondensed={isCondensed}>{render.title}</PostTitle>
        {!isDraft && viewOptions && (
          <Dropdown options={options}>
            <Icon src={OptionDots} style={{ cursor: "pointer" }} />
          </Dropdown>
        )}
      </TopSection>
      <PinIcon isPinned={render.isPinned} src={PinImg} />
      {!isCondensed && <PostContent>{render.content}</PostContent>}
      {!isCondensed && <hr style={HRStyle} />}
      <PostMetaContentWrapper className="meta">
        {render.picture ? <UserIcon src={render.picture} /> : null}
        <NameWrapper>
          {render.isInstructor && (
            <span title="Instructor">
              <Icon
                src={InstructorIcon}
                width={"20px"}
                alt={"instructor icon"}
                style={{ marginRight: "6px" }}
              />
            </span>
          )}
          <UserDescription isInstructor={render.isInstructor}>
            Posted by {render.postedBy}
          </UserDescription>
        </NameWrapper>
        <MetaIconWrapper>
          {render.isAnonymous}
          {render.isPrivate}
          {render.meta}
        </MetaIconWrapper>
      </PostMetaContentWrapper>
    </PostWrapper>
  );
};

export default Post;

const HRStyle = {
  width: "100%",
  border: "1px solid #DDDDDD",
  margin: "16px 0",
};

const PostWrapper = styled.div`
  cursor: pointer;
  position: relative;
  padding: 23px 30px;
  display: flex;
  flex-direction: column;
  flex: 1;
  text-decoration: none;
  width: 100%;
  min-height: 85px;
  margin: 2em 0;
  border-radius: 0.3em;
  background: #fff;
  box-shadow: 0px 1px 4px 2px rgba(0, 0, 0, 0.07);
  transition: all 100ms ease-in-out;
  ${(props) =>
    !props.isFocused &&
    css`
      &:hover {
        box-shadow: 0px 3px 10px 3px rgb(0 0 0 / 7%);
      }
    `}
`;

const PostTitle = styled.h2`
  /* margin: 1em 0 0.5em 2em; */
  font-size: ${(props) => (!props.isCondensed && "18px") || "14px"};
  flex: 1;
  padding-right: 3px;
  ${(props) =>
    !props.isCondensed ? "&:hover {text-decoration: underline}" : ""};
`;

const PinIcon = styled.img`
  visibility: ${(props) => (props.isPinned ? "visible" : "hidden")};
  position: absolute;
  top: 0;
  right: 0;
  width: 16px;
  height: 16px;
  margin: 1.1em 2em 0 0;
`;

const PostContent = styled.p`
  margin-top: 10px;
  font-size: 16px;
  color: #979797;
`;

const PostMetaContentWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 100%;
`;

const NameWrapper = styled.div`
  display: flex;
  align-items: center;
`;

const UserIcon = styled.img`
  float: left;
  width: 30px;
  height: 30px;
  margin-right: 0.5em;
  border-radius: 50%;
  user-select: none;
`;

const UserDescription = styled.h5`
  user-select: none;
  color: ${(props) => props.isInstructor && "#FF9900"};
`;

const MetaIconWrapper = styled.div`
  display: inline-flex;
  margin-left: auto;
  height: 100%;
`;

const TopSection = styled.div`
  display: flex;
  align-items: center;
`;
