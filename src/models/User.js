const mongoose=require('mongoose');


const userSchema=new mongoose.Schema(
    {
        email:{type:String,required:true,unique:true},
        password_hash:{type:String,required:true},
        status:{type:Boolean,default:true},
        roles:{type:String,enum:["Owner","Admin","Doctor","Receptionist","Cashier","Nurse","Lab_Tech","Pharmacist"]},
        employeeId:{type:String},
        last_login: {type: Date,default: null,}
    },
    {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
)
module.exports=mongoose.model("User",userSchema);

