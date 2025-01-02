import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema=new Schema({
    content:{
        type:String,
        required:[true,'Content is Required']
    },
    video:{
        type:Schema.Types.ObjectId,
        ref:"Video",
    },
    communityPost:{
        type:Schema.Types.ObjectId,
        ref:"Community",
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User",
    },
},{timestamps:true})
commentSchema.plugin(mongooseAggregatePaginate)   
export const Comment=mongoose.model("Comment",commentSchema)