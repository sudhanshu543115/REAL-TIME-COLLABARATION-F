import { apiSlice } from "./apiSlice";

export const canvasApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCanvas: builder.query({
      query: (roomId) => `/canvas/${roomId}`,
      providesTags: ["Canvas"],
    }),

    createCanvas: builder.mutation({
      query: (data) => ({
        url: "/canvas",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Canvas"],
    }),

    updateCanvas: builder.mutation({
      query: ({ roomId, ...body }) => ({
        url: `/canvas/${roomId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Canvas"],
    }),

    deleteCanvas: builder.mutation({
      query: (roomId) => ({
        url: `/canvas/${roomId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Canvas"],
    }),
  }),
});

export const {
  useGetCanvasQuery,
  useCreateCanvasMutation,
  useUpdateCanvasMutation,
  useDeleteCanvasMutation,
} = canvasApi;
