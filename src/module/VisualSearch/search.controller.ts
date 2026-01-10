import { catchAsync } from "../../app/utils/catchAsync";
import sendResponse from "../../app/utils/sendResponse";
import status from "http-status";
import { VisualSearchService } from "./search.service";
import config from "../../app/config";

const searchByText = catchAsync(async (req, res) => {
    const { query } = req.body;
    if (!query) {
        return res.status(400).json({ message: "Query is required" });
    }
    const result = await VisualSearchService.searchByText(query);
    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "Visual search result fetched",
        data: result,
    });
});

const searchByImage = catchAsync(async (req, res) => {

    if (!req.file) {
        return sendResponse(res, {
            statusCode: status.BAD_REQUEST,
            success: false,
            message: 'Image file is required',
            data: null
        });
    }

    const imageUrl = `${config.app_url}/uploads/search-images/${req.file.filename}`;

    const result = await VisualSearchService.searchByImage(imageUrl);
    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "Image search result fetched",
        data: result,
    });
});
export const VisualSearchController = {
    searchByText,
    searchByImage,
}