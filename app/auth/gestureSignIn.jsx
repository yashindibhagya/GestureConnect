import * as tf from "@tensorflow/tfjs-react-native";
import { useEffect } from "react";

export default function App() {
  useEffect(() => {
    async function initializeTF() {
      await tf.ready();
      console.log("TensorFlow is ready!");
    }
    initializeTF();
  }, []);

  return <></>;
}
