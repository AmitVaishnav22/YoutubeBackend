import {apiError} from "../utils/apiError.js";
import {apiResponse} from "../utils/apiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";

const healthCheck=asyncHandler(async(req,res)=>{
    return res.status(200)
              .json(new apiResponse(200,null,"Server is Healthy"))
})

export {healthCheck}
