import { apiSlice } from "./apiSlice";

export const roomApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRooms: builder.query({
      query: () => "/rooms",
      providesTags: ["Room"],
    }),

    getRoomById: builder.query({
      query: (roomId) => `/rooms/${roomId}`,
      providesTags: ["Room"],
    }),

    getRoomsForUser: builder.query({
      query: (userId) => `/rooms/user/${userId}`,
      providesTags: ["Room"],
    }),

    getUsersInRoom: builder.query({
      query: (roomId) => `/rooms/${roomId}/users`,
      providesTags: ["User", "Room"],
    }),

    createRoom: builder.mutation({
      query: (data) => ({
        url: "/rooms",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Room"],
    }),

    joinRoom: builder.mutation({
      query: ({ roomId, userId }) => ({
        url: "/rooms/join",
        method: "POST",
        body: { roomId, userId },
      }),
      invalidatesTags: ["Room", "User"],
    }),

    addUserToRoom: builder.mutation({
      query: ({ roomId, userId }) => ({
        url: `/rooms/${roomId}/users`,
        method: "POST",
        body: { userId },
      }),
      invalidatesTags: ["Room", "User"],
    }),

    removeUserFromRoom: builder.mutation({
      query: ({ roomId, userId }) => ({
        url: `/rooms/${roomId}/users`,
        method: "DELETE",
        body: { userId },
      }),
      invalidatesTags: ["Room", "User"],
    }),

    deleteRoom: builder.mutation({
      query: (roomId) => ({
        url: `/rooms/${roomId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Room"],
    }),

    requestAccess: builder.mutation({
      query: ({ roomId, userId }) => ({
        url: `/rooms/${roomId}/requestAccess`,
        method: "POST",
        body: { userId },
      }),
      invalidatesTags: ["Room", "User"],
    }),

    approveAccess: builder.mutation({
      query: ({ roomId, userId, ownerId }) => ({
        url: `/rooms/${roomId}/approveAccess`,
        method: "POST",
        body: { userId, ownerId },
      }),
      invalidatesTags: ["Room", "User"],
    }),

    rejectAccess: builder.mutation({
      query: ({ roomId, userId, ownerId }) => ({
        url: `/rooms/${roomId}/rejectAccess`,
        method: "POST",
        body: { userId, ownerId },
      }),
      invalidatesTags: ["Room", "User"],
    }),
  }),
});

export const {
  useGetRoomsQuery,
  useGetRoomByIdQuery,
  useGetRoomsForUserQuery,
  useGetUsersInRoomQuery,
  useCreateRoomMutation,
  useJoinRoomMutation,
  useAddUserToRoomMutation,
  useRemoveUserFromRoomMutation,
  useDeleteRoomMutation,
  useRequestAccessMutation,
  useApproveAccessMutation,
  useRejectAccessMutation,
} = roomApi;
