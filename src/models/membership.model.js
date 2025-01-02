import mongoose,{Schema} from "mongoose";


const membershipSchema = new Schema({
    channel:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    user:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    price:{
        type:Number,
        required:[true,"Price is required"]
    },
    tier:{
        type:String,
        enum:["basic","premium","vip"],
        default:"basic"
    },
    status:{
        type:String,
        enum:["active","cancelled","inactive"],
        default:"active"
    }
},{timestamps:true});

export const Membership = mongoose.model("Membership",membershipSchema);  