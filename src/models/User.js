const mongoose=require('mongoose');


const userSchema=new mongoose.Schema(
    {
        email:{type:String,required:true,unique:true},
        password_hash:{type:String,required:true},
        status:{type:Boolean,default:true},
        role:{type:String,enum:["owner","admin","doctor","receptionist","cashier","nurse","lab_Tech","pharmacist"],required:true},
        employeeId:{type:String},
        isFirstLogin: {type: Boolean,default: true},
        last_login: {type: Date,default: null,},
    },
    {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
)
module.exports=mongoose.model("User",userSchema);

