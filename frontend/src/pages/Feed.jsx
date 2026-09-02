import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Feed() {
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [text, setText] = useState("");
  const [image, setImage] = useState("");
  const [commentText, setCommentText] = useState({});
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchPosts();
  }, [token, navigate]);

  const fetchPosts = async () => {
    try {
      const response = await axios.get(
        "https://social-post-app-j3eo.onrender.com/api/posts"
      );

      setPosts(response.data);
    } catch (err) {
      setError("Unable to load posts.");
    } finally {
      setLoading(false);
    }
  };

  const createPost = async (e) => {
    e.preventDefault();

    if (!text.trim() && !image.trim()) {
      setError("Please enter text or an image URL.");
      return;
    }

    setPosting(true);
    setError("");

    try {
      const response = await axios.post(
        "https://social-post-app-j3eo.onrender.com/api/posts",
        {
          text: text.trim(),
          image: image.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setPosts((currentPosts) => [
        response.data.post,
        ...currentPosts,
      ]);

      setText("");
      setImage("");
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to create post."
      );
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const response = await axios.put(
        `https://social-post-app-j3eo.onrender.com/api/posts/${postId}/like`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post._id === postId ? response.data.post : post
        )
      );
    } catch (err) {
      setError("Unable to update like.");
    }
  };

  const handleComment = async (postId) => {
    const comment = commentText[postId]?.trim();

    if (!comment) {
      return;
    }

    try {
      const response = await axios.post(
        `https://social-post-app-j3eo.onrender.com/api/posts/${postId}/comment`,
        {
          text: comment,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post._id === postId ? response.data.post : post
        )
      );

      setCommentText((current) => ({
        ...current,
        [postId]: "",
      }));
    } catch (err) {
      setError("Unable to add comment.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const isLiked = (post) => {
    return post.likes?.some(
      (like) => like.username === user?.username
    );
  };

  return (
    <div className="feed-page">
      <header className="navbar">
        <div className="navbar-brand">SocialHub</div>

        <div className="navbar-user">
          <span>Hi, {user?.username}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className="feed-container">
        <section className="create-post-card">
          <h2>Create a Post</h2>

          <form onSubmit={createPost}>
            <textarea
              placeholder="What's on your mind?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows="4"
            />

            <input
              type="url"
              placeholder="Image URL (optional)"
              value={image}
              onChange={(e) => setImage(e.target.value)}
            />

            <button type="submit" disabled={posting}>
              {posting ? "Posting..." : "Post"}
            </button>
          </form>
        </section>

        {error && <p className="error-message">{error}</p>}

        <section className="posts-section">
          <h2>Social Feed</h2>

          {loading ? (
            <p>Loading posts...</p>
          ) : posts.length === 0 ? (
            <p>No posts yet. Be the first to post!</p>
          ) : (
            posts.map((post) => (
              <article className="post-card" key={post._id}>
                <div className="post-header">
                  <div className="avatar">
                    {post.username.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <strong>{post.username}</strong>
                    <small>
                      {new Date(post.createdAt).toLocaleString()}
                    </small>
                  </div>
                </div>

                {post.text && (
                  <p className="post-text">{post.text}</p>
                )}

                {post.image && (
                  <img
                    className="post-image"
                    src={post.image}
                    alt="Post"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                )}

                <div className="post-stats">
                  <span>
                    ❤️ {post.likes?.length || 0} likes
                  </span>

                  <span>
                    💬 {post.comments?.length || 0} comments
                  </span>
                </div>

                <div className="post-actions">
                  <button
                    className={isLiked(post) ? "liked" : ""}
                    onClick={() => handleLike(post._id)}
                  >
                    {isLiked(post) ? "❤️ Liked" : "♡ Like"}
                  </button>
                </div>

                <div className="comments">
                  {post.comments?.map((comment) => (
                    <div
                      className="comment"
                      key={comment._id}
                    >
                      <strong>{comment.username}</strong>
                      <span>{comment.text}</span>
                    </div>
                  ))}

                  <div className="comment-form">
                    <input
                      type="text"
                      placeholder="Write a comment..."
                      value={commentText[post._id] || ""}
                      onChange={(e) =>
                        setCommentText({
                          ...commentText,
                          [post._id]: e.target.value,
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleComment(post._id);
                        }
                      }}
                    />

                    <button
                      onClick={() => handleComment(post._id)}
                    >
                      Comment
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </main>
    </div>
  );
}

export default Feed;