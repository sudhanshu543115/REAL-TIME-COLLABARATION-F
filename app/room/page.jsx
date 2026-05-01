"use client";

import {
  useCreateRoomMutation,
  useDeleteRoomMutation,
  useGetRoomsForUserQuery,
  useGetRoomsQuery,
  useRequestAccessMutation,
} from "../../src/store/api/roomApi";
import Protected from "../../src/auth/protectedRoutes";
import { registerSocketUser, socket } from "../../src/lib/socket";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RoomPage() {
  const router = useRouter();
  const [roomName, setRoomName] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [feedback, setFeedback] = useState("");
  const [approvedRoom, setApprovedRoom] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [createRoom, { isLoading: isCreating }] = useCreateRoomMutation();
  const [requestAccess, { isLoading: isRequesting }] = useRequestAccessMutation();
  const [deleteRoom, { isLoading: isDeleting }] = useDeleteRoomMutation();
  const [user] = useState(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const { data: rooms, isLoading: roomsLoading } = useGetRoomsQuery();
  const { data: myRooms, isLoading: myRoomsLoading } = useGetRoomsForUserQuery(
    user?._id,
    { skip: !user?._id }
  );

  const pushNotification = (message) => {
    const id = `${Date.now()}-${Math.random()}`;

    setNotifications((current) => [...current, { id, message }]);

    setTimeout(() => {
      setNotifications((current) => current.filter((item) => item.id !== id));
    }, 4000);
  };

  useEffect(() => {
    if (!user?._id) return;

    registerSocketUser(user._id);

    const handleAccessRequested = ({ roomName: requestedRoomName, requesterId }) => {
      pushNotification(
        `New access request for ${requestedRoomName || "your room"} from user ${requesterId}.`
      );
    };

    const handleAccessApproved = ({ roomId, roomName: approvedRoomName }) => {
      setApprovedRoom({
        roomId,
        roomName: approvedRoomName || "Approved room",
      });
      pushNotification(
        `Access approved for ${approvedRoomName || "room"}. You can open it now.`
      );
    };

    const handleAccessRejected = ({ roomName: rejectedRoomName }) => {
      pushNotification(
        `Your access request was rejected for ${rejectedRoomName || "this room"}.`
      );
    };

    socket.on("access-requested", handleAccessRequested);
    socket.on("access-approved", handleAccessApproved);
    socket.on("access-rejected", handleAccessRejected);

    return () => {
      socket.off("access-requested", handleAccessRequested);
      socket.off("access-approved", handleAccessApproved);
      socket.off("access-rejected", handleAccessRejected);
    };
  }, [router, user?._id]);

  const handleCreate = async () => {
    if (!roomName.trim() || !user?._id) {
      setFeedback("Please enter a room name and log in again.");
      return;
    }

    try {
      const room = await createRoom({
        name: roomName.trim(),
        userId: user._id,
      }).unwrap();

      setRoomName("");
      setFeedback("Room created successfully.");

      if (room?._id) {
        router.push(`/room/${room._id}`);
      }
    } catch (error) {
      console.error("Create room error:", error);
      setFeedback("Unable to create room right now.");
    }
  };

  const handleRequestJoin = async (roomId = joinRoomId) => {
    if (!roomId || !user?._id) {
      setFeedback("Please log in again before requesting access.");
      return;
    }

    try {
      await requestAccess({
        roomId,
        userId: user._id,
      }).unwrap();

      setJoinRoomId("");
      setFeedback("Access request sent to the room owner.");
      pushNotification("Access request sent. Waiting for owner approval.");
    } catch (error) {
      console.error("Request access error:", error);
      setFeedback("Unable to send access request for this room.");
    }
  };

  const handleDelete = async (roomId) => {
    try {
      await deleteRoom(roomId).unwrap();
      setFeedback("Room deleted successfully.");
    } catch (error) {
      console.error("Delete room error:", error);
      setFeedback("Unable to delete this room.");
    }
  };

  const userHasAccess = (room) =>
    room?.participants?.some((participant) => participant?._id === user?._id);

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
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">
                  Room dashboard
                </p>
                <h1 className="mt-3 text-4xl font-black text-slate-900 md:text-5xl">
                  Request access before entering a room.
                </h1>
                <p className="mt-4 text-base leading-7 text-slate-600">
                  Join requests now go to the room owner first. If the owner
                  approves, you get a live notification and direct access.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="btn-ghost"
                >
                  Home
                </button>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    router.push("/auth/login");
                  }}
                  className="btn-secondary"
                >
                  Logout
                </button>
              </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-6">
                <div className="section-card rounded-[1.75rem] p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
                    Create room
                  </p>
                  <h2 className="mt-3 text-2xl font-black text-slate-900">
                    Start a fresh collaboration space
                  </h2>
                  <div className="mt-5 space-y-4">
                    <input
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      placeholder="Enter room name"
                      className="ui-input"
                    />
                    <button
                      onClick={handleCreate}
                      disabled={isCreating}
                      className="btn-primary w-full"
                    >
                      {isCreating ? "Creating..." : "Create room"}
                    </button>
                  </div>
                </div>

                <div className="section-card rounded-[1.75rem] p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
                    Request by room ID
                  </p>
                  <h2 className="mt-3 text-2xl font-black text-slate-900">
                    Ask the owner for access
                  </h2>
                  <div className="mt-5 space-y-4">
                    <input
                      value={joinRoomId}
                      onChange={(e) => setJoinRoomId(e.target.value)}
                      placeholder="Paste room ID"
                      className="ui-input"
                    />
                    <button
                      onClick={() => handleRequestJoin()}
                      disabled={isRequesting}
                      className="btn-ghost w-full"
                    >
                      {isRequesting ? "Sending..." : "Request access"}
                    </button>
                  </div>
                </div>

                <div className="section-card rounded-[1.75rem] p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    My rooms
                  </p>
                  <h2 className="mt-3 text-2xl font-black text-slate-900">
                    Rooms where you already have access
                  </h2>

                  {myRoomsLoading ? (
                    <p className="status-neutral mt-5">Loading your rooms...</p>
                  ) : myRooms?.length ? (
                    <div className="mt-5 space-y-3">
                      {myRooms.map((room) => (
                        <div
                          key={room._id}
                          className="rounded-[1.1rem] border border-slate-200/70 bg-white/75 px-4 py-4 transition hover:border-emerald-700/30 hover:bg-white"
                        >
                          <p className="text-lg font-black text-slate-900">
                            {room.name}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Open room details, members, pending requests, or go
                            straight to the docs canvas.
                          </p>
                          <div className="mt-4 flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() => router.push(`/room/${room._id}`)}
                              className="btn-ghost"
                            >
                              Room details
                            </button>
                            <button
                              type="button"
                              onClick={() => router.push(`/room/${room._id}/docs`)}
                              className="btn-primary"
                            >
                              Open canvas
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="status-neutral mt-5">
                      You do not have approved room access yet.
                    </p>
                  )}
                </div>

                {feedback && (
                  <p
                    className={
                      feedback.toLowerCase().includes("unable") ||
                      feedback.toLowerCase().includes("please")
                        ? "status-error"
                        : "status-success"
                    }
                  >
                    {feedback}
                  </p>
                )}

                {approvedRoom && (
                  <div className="section-card rounded-[1.75rem] p-6">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                      Access granted
                    </p>
                    <h2 className="mt-3 text-2xl font-black text-slate-900">
                      {approvedRoom.roomName}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Your request was accepted. Use the button below to open the
                      approved room.
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/room/${approvedRoom.roomId}/docs`)
                      }
                      className="btn-primary mt-5 w-full"
                    >
                      Open approved canvas
                    </button>
                  </div>
                )}
              </div>

              <div className="section-card rounded-[1.75rem] p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                      All rooms
                    </p>
                    <h2 className="mt-3 text-2xl font-black text-slate-900">
                      Access-controlled workspace list
                    </h2>
                  </div>
                  <div className="rounded-full bg-emerald-900/8 px-4 py-2 text-sm font-bold text-emerald-900">
                    {rooms?.length ?? 0} rooms
                  </div>
                </div>

                {roomsLoading ? (
                  <p className="status-neutral mt-6">Loading rooms...</p>
                ) : rooms?.length ? (
                  <div className="mt-6 space-y-4">
                    {rooms.map((room, index) => {
                      const hasAccess = userHasAccess(room);
                      const isOwner = room?.createdBy?._id === user?._id;

                      return (
                        <div
                          key={room._id}
                          className="rounded-[1.4rem] border border-slate-200/70 bg-white/70 p-5 shadow-[0_12px_32px_rgba(15,23,42,0.06)]"
                        >
                          <div className="flex flex-col gap-4">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                                Room {index + 1}
                              </p>
                              <h3 className="mt-2 text-xl font-black text-slate-900">
                                {room.name}
                              </h3>
                              <p className="mt-2 text-sm text-slate-500">
                                Owner: {room?.createdBy?.name || "Unknown"}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                Pending requests: {room?.pendingAccessRequests?.length ?? 0}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                              {hasAccess ? (
                                <>
                                  <button
                                    onClick={() => router.push(`/room/${room._id}`)}
                                    className="btn-ghost min-w-32"
                                  >
                                    Room details
                                  </button>
                                  <button
                                    onClick={() =>
                                      router.push(`/room/${room._id}/docs`)
                                    }
                                    className="btn-primary min-w-32"
                                  >
                                    Open canvas
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleRequestJoin(room._id)}
                                  disabled={isRequesting}
                                  className="btn-primary min-w-32"
                                >
                                  Request access
                                </button>
                              )}

                              {!hasAccess && (
                                <button
                                  onClick={() => router.push(`/room/${room._id}`)}
                                  className="btn-ghost min-w-32"
                                >
                                  Details
                                </button>
                              )}

                              {isOwner && (
                                <button
                                  onClick={() => handleDelete(room._id)}
                                  disabled={isDeleting}
                                  className="rounded-full bg-red-50 px-5 py-3 font-bold text-red-700 transition hover:bg-red-100"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="status-neutral mt-6">
                    No rooms available yet. Create the first one from the panel
                    on the left.
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
