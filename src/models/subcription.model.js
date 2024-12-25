import moongoose,{Schema} from "moongoose"


const subscriptionSchema=new Schema({
    subscriber:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    channel:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
},{timestamps:true})

export const Subcription=moongoose.model("Subscription",subscriptionSchema)  