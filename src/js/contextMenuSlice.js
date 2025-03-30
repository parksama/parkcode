import { createSlice } from "@reduxjs/toolkit";

const contextMenuSlice = createSlice({
	name: "contextMenu",
	initialState: null,
	reducers: {
		updateData: (state, action) => {
			state = action.payload;
		},
	},
});

export const { updateData } = contextMenuSlice.actions;
export default contextMenuSlice.reducer;
