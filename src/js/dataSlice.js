import { createSlice } from "@reduxjs/toolkit";

const dataSlice = createSlice({
	name: "data",
	initialState: {
		value: "Hello from Redux!",
		contextMenu: null,
	},
	reducers: {
		updateData: (state, action) => {
			state.value = action.payload;
		},
		updateContextMenu: (state, action) => {
			state.contextMenu = action.payload;
		},
	},
});

export const { updateData, updateContextMenu } = dataSlice.actions;
export default dataSlice.reducer;
