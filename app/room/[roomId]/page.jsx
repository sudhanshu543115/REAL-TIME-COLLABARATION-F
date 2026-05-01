"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useAddUserToRoomMutation,
  useApproveAccessMutation,
  useGetRoomByIdQuery,
  useGetUsersInRoomQuery,
  useRejectAccessMutation,
  useRemoveUserFromRoomMutation,
  useRequestAccessMutation,
} from "../../../src/store/api/roomApi";
import Protected from "../../../src/auth/protectedRoutes";
import { registerSocketUser, socket } from "../../../src/lib/socket";

export default function RoomChatPage() {
  const { roomId } = useParams();
  const router = useRouter();
  const [memberUserId, setMemberUserId] = useState("");
  const [feedback, setFeedback] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [user] = useState(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const { data: room, isLoading: roomLoading } = useGetRoomByIdQuery(roomId, {
    skip: !roomId,
  });
  const { data: users, isLoading: usersLoading } = useGetUsersInRoomQuery(roomId, {
    skip: !roomId,
  });

  const [requestAccess, { isLoading: isRequesting }] = useRequestAccessMutation();
  const [addUserToRoom, { isLoading: isAdding }] = useAddUserToRoomMutation();
  const [removeUserFromRoom, { isLoading: isRemoving }] =
    useRemoveUserFromRoomMutation();
  const [approveAccess, { isLoading: isApproving }] = useApproveAccessMutation();
  const [rejectAccess, { isLoading: isRejecting }] = useRejectAccessMutation();

  const pushNotification = (message) => {
    const id = `${Date.now()}-${Math.random()}`;

    setNotifications((current) => [...current, { id, message }]);

    setTimeout(() => {
      setNotifications((current) => current.filter((item) => item.id !== id));
    }, 4000);
  };

  const isOwner = room?.createdBy?._id === user?._id;
  const hasAccess = room?.participants?.some(
    (participant) => participant?._id === user?._id
  );

  useEffect(() => {
    if (!roomId || !user?._id) return;

    registerSocketUser(user._id);
    socket.emit("join-room", {
      roomId,
      userId: user._id,
    });

    const handleAccessRequested = ({ roomName, requesterId }) => {
      pushNotification(
        `Access requested for ${roomName || "your room"} by user ${requesterId}.`
      );
    };

    const handleAccessApproved = ({ roomName }) => {
      pushNotification(`Access approved for ${roomName || "this room"}.`);
    };

    const handleAccessRejected = ({ roomName }) => {
      pushNotification(`Access rejected for ${roomName || "this room"}.`);
    };

    socket.on("access-requested", handleAccessRequested);
    socket.on("access-approved", handleAccessApproved);
    socket.on("access-rejected", handleAccessRejected);

    return () => {
      socket.emit("leave-room", {
        roomId,
        userId: user._id,
      });

      socket.off("access-requested", handleAccessRequested);
      socket.off("access-approved", handleAccessApproved);
      socket.off("access-rejected", handleAccessRejected);
    };
  }, [roomId, user?._id]);

  const handleRequestAccess = async () => {
    try {
      await requestAccess({ roomId, userId: user?._id }).unwrap();
      setFeedback("Access request sent.");
      pushNotification("Access request sent to the room owner.");
    } catch (error) {
      console.error("Request access error:", error);
      setFeedback("Unable to send access request.");
    }
  };

  const handleAddUser = async () => {
    if (!memberUserId.trim()) {
      setFeedback("Enter a user ID to add.");
      return;
    }

    try {
      await addUserToRoom({
        roomId,
        userId: memberUserId.trim(),
      }).unwrap();
      setMemberUserId("");
      setFeedback("User added to room.");
    } catch (error) {
      console.error("Add user error:", error);
      setFeedback("Unable to add this user.");
    }
  };

  const handleRemoveUser = async (userIdToRemove) => {
    try {
      await removeUserFromRoom({
        roomId,
        userId: userIdToRemove,
      }).unwrap();
      setFeedback("User removed from room.");
    } catch (error) {
      console.error("Remove user error:", error);
      setFeedback("Unable to remove this user.");
    }
  };

  const handleApprove = async (requestUserId) => {
    try {
      await approveAccess({
        roomId,
        userId: requestUserId,
        ownerId: user?._id,
      }).unwrap();
      setFeedback("Access approved.");
      pushNotification("User approved successfully.");
    } catch (error) {
      console.error("Approve access error:", error);
      setFeedback("Unable to approve access.");
    }
  };

  const handleReject = async (requestUserId) => {
    try {
      await rejectAccess({
        roomId,
        userId: requestUserId,
        ownerId: user?._id,
      }).unwrap();
      setFeedback("Access rejected.");
      pushNotification("User rejected successfully.");
    } catch (error) {
      console.error("Reject access error:", error);
      setFeedback("Unable to reject access.");
    }
  };

  return (
    <Protected>
      <main className="min-h-screen px-6 py-8 md:px-10">
        <section className="mx-auto max-w-6xl">
          <div className="fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-3">
            {notifications.map((item) => (
              <div
                key={item.id}
                className="glass-panel rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800"
              >
                {item.message}
              </div>
            ))}
          </div>

          <div className="glass-panel rounded-[2rem] p-6 md:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-800">
                  Room details
                </p>
                <h1 className="mt-3 text-4xl font-black text-slate-900">
                  {room?.name || "Loading room..."}
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Room ID: {roomId}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/room")}
                  className="btn-ghost"
                >
                  Back to dashboard
                </button>
                {!hasAccess && (
                  <button
                    type="button"
                    onClick={handleRequestAccess}
                    disabled={isRequesting}
                    className="btn-secondary"
                  >
                    {isRequesting ? "Requesting..." : "Request access"}
                  </button>
                )}
              </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.95fr]">
              <div className="space-y-6">
                <div className="section-card rounded-[1.75rem] p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
                    Room overview
                  </p>
                  {roomLoading ? (
                    <p className="status-neutral mt-5">Loading room data...</p>
                  ) : (
                    <div className="mt-5 space-y-3 text-sm text-slate-600">
                      <p>
                        <span className="font-bold text-slate-900">Name:</span>{" "}
                        {room?.name || "Untitled room"}
                      </p>
                      <p>
                        <span className="font-bold text-slate-900">Owner:</span>{" "}
                        {room?.createdBy?.name || "Unknown"}
                      </p>
                      <p>
                        <span className="font-bold text-slate-900">Created:</span>{" "}
                        {room?.createdAt
                          ? new Date(room.createdAt).toLocaleString()
                          : "Not available"}
                      </p>
                      <p>
                        <span className="font-bold text-slate-900">Participants:</span>{" "}
                        {users?.length ?? 0}
                      </p>
                    </div>
                  )}
                </div>

                {isOwner && (
                  <div className="section-card rounded-[1.75rem] p-6">
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">
                      Pending requests
                    </p>
                    <h2 className="mt-3 text-2xl font-black text-slate-900">
                      Approve or reject join requests
                    </h2>

                    {room?.pendingAccessRequests?.length ? (
                      <div className="mt-5 space-y-4">
                        {room.pendingAccessRequests.map((requestUser) => (
                          <div
                            key={requestUser._id}
                            className="rounded-[1.25rem] border border-slate-200/70 bg-white/75 p-4"
                          >
                            <p className="text-lg font-black text-slate-900">
                              {requestUser.name || "Unnamed user"}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {requestUser.email || requestUser._id}
                            </p>
                            <div className="mt-4 flex flex-wrap gap-3">
                              <button
                                onClick={() => handleApprove(requestUser._id)}
                                disabled={isApproving}
                                className="btn-primary"
                              >
                                {isApproving ? "Approving..." : "Approve"}
                              </button>
                              <button
                                onClick={() => handleReject(requestUser._id)}
                                disabled={isRejecting}
                                className="rounded-full bg-red-50 px-5 py-3 font-bold text-red-700 transition hover:bg-red-100"
                              >
                                {isRejecting ? "Rejecting..." : "Reject"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="status-neutral mt-5">
                        No pending access requests right now.
                      </p>
                    )}
                  </div>
                )}

                {isOwner && (
                  <div className="section-card rounded-[1.75rem] p-6">
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-700">
                      Add user to room
                    </p>
                    <div className="mt-5 space-y-4">
                      <input
                        value={memberUserId}
                        onChange={(e) => setMemberUserId(e.target.value)}
                        placeholder="Enter user ID"
                        className="ui-input"
                      />
                      <button
                        onClick={handleAddUser}
                        disabled={isAdding}
                        className="btn-primary w-full"
                      >
                        {isAdding ? "Adding..." : "Add user"}
                      </button>
                    </div>
                  </div>
                )}

                {feedback && (
                  <p
                    className={
                      feedback.toLowerCase().includes("unable") ||
                      feedback.toLowerCase().includes("enter")
                        ? "status-error"
                        : "status-success"
                    }
                  >
                    {feedback}
                  </p>
                )}
              </div>

              <div className="section-card rounded-[1.75rem] p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
                  Users in room
                </p>
                <h2 className="mt-3 text-2xl font-black text-slate-900">
                  Current participants
                </h2>

                {usersLoading ? (
                  <p className="status-neutral mt-6">Loading users...</p>
                ) : users?.length ? (
                  <div className="mt-6 space-y-4">
                    {users.map((member) => (
                      <div
                        key={member._id}
                        className="rounded-[1.4rem] border border-slate-200/70 bg-white/70 p-5 shadow-[0_12px_32px_rgba(15,23,42,0.06)]"
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-lg font-black text-slate-900">
                              {member.name || "Unnamed user"}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {member.email || member._id}
                            </p>
                          </div>
                          {isOwner && member._id !== user?._id && (
                            <button
                              onClick={() => handleRemoveUser(member._id)}
                              disabled={isRemoving}
                              className="rounded-full bg-red-50 px-5 py-3 font-bold text-red-700 transition hover:bg-red-100"
                            >
                              {isRemoving ? "Removing..." : "Remove"}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="status-neutral mt-6">
                    No users found in this room yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </Protected>
  );
}
