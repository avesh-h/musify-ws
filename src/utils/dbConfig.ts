import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const DB_URI: string | undefined = process.env.DB_URI;

let isConnected = false;

const connectToDB = async () => {
  if (!DB_URI) return console.log("Invalid DB URI!");
  if (isConnected) {
    // is already connected
    return console.log("DB is already connected!");
  }

  const db = mongoose.connection;

  db.on("open", () => {
    console.log("DB is connected!");
  });

  db.on("error", (error) => {
    console.log("DB connection error " + error);
  });

  db.on("disconnected", () => console.log("DB disconnected!"));

  await mongoose.connect(DB_URI);

  isConnected = true;
};

export default connectToDB;

// For just close the db connection whenever the process is close.
process.on("SIGINT", async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log("DB connection closed!");
    process.exit(0);
  } catch (error) {
    console.error("Error closing DB connection:", error);
    process.exit(1); // for let know the process that the connection didn't close get error.
  }
});
