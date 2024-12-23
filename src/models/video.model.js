import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema=new Schema({
    videoFile:{
        type:String,
        required:[true,'Video is Required']
    },
    thumbnail:{
        type:String,
        required:[true,'Thumbnail is Required'],
    },
    title:{
        type:String,
        required:[true,'Title is Required'],
    },
    description:{
        type:String,
        required:[true,'Description is Required'],
    },
    duration:{
        type:Number,
        required:[true,'Duration is Required'],
    },
    views:{
        type:Number,
        default:0
    },
    isPublished:{
        type:Boolean,
        default:true
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
},{timestamps:true})

videoSchema.plugin(mongooseAggregatePaginate)   // to enable aggregation pipelines

export const Video=mongoose.model("Video",videoSchema)