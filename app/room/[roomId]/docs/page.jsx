"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Protected from "../../../../src/auth/protectedRoutes";
import { registerSocketUser, socket } from "../../../../src/lib/socket";
import { useGetRoomByIdQuery } from "../../../../src/store/api/roomApi";
import {
  useCreateCanvasMutation,
  useGetCanvasQuery,
  useUpdateCanvasMutation,
} from "../../../../src/store/api/canvasApi";

export default function RoomDocsPage() {
  const { roomId } = useParams();
  const router = useRouter();
  const textareaRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const [content, setContent] = useState("");
  const [pdfName, setPdfName] = useState("");
  const [pdfDataUrl, setPdfDataUrl] = useState("");
  const [remoteEditors, setRemoteEditors] = useState({});
  const [feedback, setFeedback] = useState("");
  const [user] = useState(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const rawUser = localStorage.getItem("user");
    return rawUser ? JSON.parse(rawUser) : null;
  });

  const { data: room, isLoading: roomLoading } = useGetRoomByIdQuery(roomId, {
    skip: !roomId,
  });
  const { data: canvas, isLoading: canvasLoading } = useGetCanvasQuery(roomId, {
    skip: !roomId,
  });
  const [createCanvas, { isLoading: isCreatingCanvas }] = useCreateCanvasMutation();
  const [updateCanvas, { isLoading: isSaving }] = useUpdateCanvasMutation();

  const isOwner = room?.createdBy?._id === user?._id;
  const hasAccess =
    isOwner ||
    room?.participants?.some((participant) => participant?._id === user?._id);

  useEffect(() => {
    if (!canvas) {
      return;
    }

    setContent(canvas.content || "");
    setPdfName(canvas.pdfName || "");
    setPdfDataUrl(canvas.pdfDataUrl || "");
  }, [canvas]);

  useEffect(() => {
    if (!roomId || !user?._id) return;

    registerSocketUser(user._id);
    socket.emit("join-room", {
      roomId,
      userId: user._id,
    });

    const handleDocsContentUpdated = ({ content: nextContent, user: editingUser }) => {
      if (editingUser?._id === user._id) {
        return;
      }

      setContent(nextContent ?? "");
      setRemoteEditors((current) => ({
        ...current,
        [editingUser._id]: {
          ...editingUser,
          updatedAt: Date.now(),
        },
      }));
    };

    const handleDocsPresenceUpdated = ({ user: editingUser }) => {
      if (!editingUser?._id || editingUser._id === user._id) {
        return;
      }

      setRemoteEditors((current) => ({
        ...current,
        [editingUser._id]: {
          ...editingUser,
          updatedAt: Date.now(),
        },
      }));
    };

    socket.on("docs-content-updated", handleDocsContentUpdated);
    socket.on("docs-presence-updated", handleDocsPresenceUpdated);

    return () => {
      socket.emit("leave-room", {
        roomId,
        userId: user._id,
      });
      socket.off("docs-content-updated", handleDocsContentUpdated);
      socket.off("docs-presence-updated", handleDocsPresenceUpdated);
    };
  }, [roomId, user?._id]);

  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setRemoteEditors((current) => {
        const now = Date.now();
        return Object.fromEntries(
          Object.entries(current).filter(([, editor]) => now - editor.updatedAt < 6000)
        );
      });
    }, 2000);

    return () => clearInterval(cleanupInterval);
  }, []);

  const persistCanvas = (nextContent, nextPdfName = pdfName, nextPdfDataUrl = pdfDataUrl) => {
    if (!roomId || !user?._id) {
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        if (!canvas) {
          await createCanvas({
            roomId,
            content: nextContent,
            pdfName: nextPdfName,
            pdfDataUrl: nextPdfDataUrl,
          }).unwrap();
        } else {
          await updateCanvas({
            roomId,
            content: nextContent,
            pdfName: nextPdfName,
            pdfDataUrl: nextPdfDataUrl,
          }).unwrap();
        }

        setFeedback("Docs saved.");
      } catch (error) {
        console.error("Canvas save error:", error);
        setFeedback("Unable to save docs right now.");
      }
    }, 700);
  };

  const emitPresence = (value) => {
    const caretPosition = textareaRef.current?.selectionStart ?? 0;
    const beforeCaret = value.slice(0, caretPosition);
    const line = beforeCaret.split("\n").length;

    socket.emit("docs-presence-update", {
      roomId,
      user: {
        _id: user?._id,
        name: user?.name || "Unknown user",
        line,
        caretPosition,
      },
    });
  };

  const handleContentChange = (event) => {
    const nextContent = event.target.value;
    setContent(nextContent);

    socket.emit("docs-content-change", {
      roomId,
      content: nextContent,
      user: {
        _id: user?._id,
        name: user?.name || "Unknown user",
      },
    });

    emitPresence(nextContent);
    persistCanvas(nextContent);
  };

  const handleCursorActivity = () => {
    emitPresence(content);
  };

  const handlePdfUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.type !== "application/pdf") {
      setFeedback("Please upload a PDF file only.");
      return;
    }

    const reader = new FileReader();

    reader.onload = async () => {
      const nextPdfDataUrl = String(reader.result || "");
      setPdfName(file.name);
      setPdfDataUrl(nextPdfDataUrl);
      persistCanvas(content, file.name, nextPdfDataUrl);
      setFeedback("PDF uploaded successfully.");
    };

    reader.readAsDataURL(file);
  };

  return (
    <Protected>
      <main className="min-h-screen px-6 py-8 md:px-10">
        <section className="mx-auto max-w-7xl">
          <div className="glass-panel rounded-[2rem] p-6 md:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-800">
                  Shared docs canvas
                </p>
                <h1 className="mt-3 text-4xl font-black text-slate-900">
                  {room?.name || "Room docs"}
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Owners can upload a PDF. Approved members can edit shared notes
                  in real time and see who is editing and where.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => router.push(`/room/${roomId}`)}
                  className="btn-ghost"
                >
                  Back to room
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/room")}
                  className="btn-secondary"
                >
                  Dashboard
                </button>
              </div>
            </div>

            {roomLoading || canvasLoading ? (
              <p className="status-neutral mt-8">Loading docs workspace...</p>
            ) : !hasAccess ? (
              <div className="status-error mt-8">
                You do not have access to this docs workspace yet.
              </div>
            ) : (
              <div className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-6">
                  <div className="section-card rounded-[1.75rem] p-6">
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-700">
                      PDF document
                    </p>
                    <h2 className="mt-3 text-2xl font-black text-slate-900">
                      Reference file for this room
                    </h2>

                    {isOwner && (
                      <div className="mt-5">
                        <label className="ui-label">Upload PDF</label>
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={handlePdfUpload}
                          className="ui-input"
                        />
                      </div>
                    )}

                    {pdfName ? (
                      <div className="mt-5 rounded-[1.25rem] border border-slate-200/70 bg-white/75 p-4">
                        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Current file
                        </p>
                        <p className="mt-2 text-lg font-black text-slate-900">
                          {pdfName}
                        </p>
                      </div>
                    ) : (
                      <p className="status-neutral mt-5">
                        No PDF uploaded yet.
                      </p>
                    )}

                    {pdfDataUrl && (
                      <iframe
                        title="Room PDF"
                        src={pdfDataUrl}
                        className="mt-5 h-[28rem] w-full rounded-[1.25rem] border border-slate-200/70 bg-white"
                      />
                    )}
                  </div>

                  <div className="section-card rounded-[1.75rem] p-6">
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">
                      Live editors
                    </p>
                    <h2 className="mt-3 text-2xl font-black text-slate-900">
                      Who is editing right now
                    </h2>

                    {Object.values(remoteEditors).length ? (
                      <div className="mt-5 space-y-3">
                        {Object.values(remoteEditors).map((editor) => (
                          <div
                            key={editor._id}
                            className="rounded-[1.2rem] border border-slate-200/70 bg-white/75 p-4"
                          >
                            <p className="text-lg font-black text-slate-900">
                              {editor.name}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              Editing around line {editor.line || 1}, character{" "}
                              {editor.caretPosition ?? 0}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="status-neutral mt-5">
                        No other user is editing right now.
                      </p>
                    )}
                  </div>
                </div>

                <div className="section-card rounded-[1.75rem] p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
                        Shared notes
                      </p>
                      <h2 className="mt-3 text-2xl font-black text-slate-900">
                        Collaborative docs editor
                      </h2>
                    </div>
                    <div className="rounded-full bg-emerald-900/8 px-4 py-2 text-sm font-bold text-emerald-900">
                      {isSaving || isCreatingCanvas ? "Saving..." : "Live"}
                    </div>
                  </div>

                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={handleContentChange}
                    onKeyUp={handleCursorActivity}
                    onClick={handleCursorActivity}
                    onSelect={handleCursorActivity}
                    placeholder="Write shared documentation, meeting notes, editing instructions, or document annotations here..."
                    className="ui-input mt-6 min-h-[34rem] resize-y leading-7"
                  />

                  {feedback && (
                    <p
                      className={`mt-5 ${
                        feedback.toLowerCase().includes("unable") ||
                        feedback.toLowerCase().includes("only")
                          ? "status-error"
                          : "status-success"
                      }`}
                    >
                      {feedback}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </Protected>
  );
}
