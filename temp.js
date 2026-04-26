import bcrypt from "bcrypt"

const run = async()=>{
    try{
         const userPassword = "sukku12345"
         const hashedPassword = await bcrypt.hash(userPassword,10)
         console.log("Hashed Password:", hashedPassword);
         const adminPassword = "admin12345"
         const adminHashedPassword = await bcrypt.hash(adminPassword,10)
         console.log("Admin Hashed Password:", adminHashedPassword);
    }
    catch(error){
        console.error("Error hashing passwords:", error);
    }
}
run()