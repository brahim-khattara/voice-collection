"use client";
import { useState, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const VoiceVisualizer = ({ stream }) => {
  // VoiceVisualizer component remains unchanged
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!stream) return;

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = "rgb(200, 200, 200)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 10;
        ctx.fillStyle = `rgb(255, ${Math.min(barHeight + 100, 255)}, ${Math.min(
          barHeight + 100,
          255
        )})`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
      source.disconnect();
      audioContext.close();
    };
  }, [stream]);

  return (
    <canvas
      ref={canvasRef}
      width="200"
      height="60"
      className="rounded bg-gray-200"
    />
  );
};

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [age, setAge] = useState("");
  const [recordings, setRecordings] = useState({});
  const [recordingBlobs, setRecordingBlobs] = useState({}); // Store actual blob data
  const [isRecording, setIsRecording] = useState(false);
  const [currentRecording, setCurrentRecording] = useState({
    number: null,
    variation: null,
  });
  const [stream, setStream] = useState(null);
  const [isUploading, setIsUploading] = useState(false); // Track upload state
  const [uploadProgress, setUploadProgress] = useState(0); // Track upload progress
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null; // Prevent SSR mismatch

  const numbers = Array.from({ length: 9 }, (_, i) => i + 1);
  const variations = ["أ", "ب", "ج"];

  const startRecording = async (number, variation) => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      setStream(audioStream);
      const mediaRecorder = new MediaRecorder(audioStream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        const audioUrl = URL.createObjectURL(audioBlob);

        // Store both the URL for playback and the blob for upload
        setRecordings((prev) => ({
          ...prev,
          [`${number}-${variation}`]: audioUrl,
        }));

        setRecordingBlobs((prev) => ({
          ...prev,
          [`${number}-${variation}`]: audioBlob,
        }));

        setIsRecording(false);
        setCurrentRecording({ number: null, variation: null });
        setStream(null);
        audioStream.getTracks().forEach((track) => track.stop());
      };

      setIsRecording(true);
      setCurrentRecording({ number, variation });
      mediaRecorder.start();

      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
      }, 3000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert(
        "Error accessing microphone. Please ensure you have granted microphone permissions."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setCurrentRecording({ number: null, variation: null });
    }
  };

  // Update the handleSubmit function to fix the error
  const handleSubmit = async () => {
    const requiredRecordings = numbers.length * variations.length;
    const currentRecordings = Object.keys(recordings).length;
  
    if (currentRecordings < requiredRecordings) {
      alert(
        `يرجى إكمال جميع التسجيلات (${currentRecordings}/${requiredRecordings} تم تسجيلها)`
      );
      return;
    }
  
    if (!age) {
      alert("يرجى إدخال العمر");
      return;
    }
  
    try {
      setIsUploading(true);
      setUploadProgress(0);
  
      // Insert participant data into the 'participants' table
      const { data: participantData, error: participantError } = await supabase
        .from("participants")
        .insert([
          {
            age: parseInt(age),
            created_at: new Date().toISOString(),
            upload_completed: false,
          },
        ])
        .select(); // Use .select() to return the inserted row
  
      if (participantError) {
        console.error("Error saving participant data:", participantError);
        throw new Error(`Error saving participant data: ${participantError.message}`);
      } else {
        console.log("Participant data saved successfully:", participantData);
        const participantId = participantData[0].id; // Get the auto-generated ID
        console.log("Auto-generated ID:", participantId);
      }
  
      // Upload each recording to the appropriate folder
      const uploadPromises = [];
      let completedUploads = 0;
  
      for (const [key, blob] of Object.entries(recordingBlobs)) {
        const [number, variation] = key.split("-");
  
        // Convert Arabic variation characters to Latin letters
        let variationLatin;
        switch (variation) {
          case "أ":
            variationLatin = "1";
            break;
          case "ب":
            variationLatin = "2";
            break;
          case "ج":
            variationLatin = "3";
            break;
          default:
            variationLatin = variation;
        }
  
        // Create the file path following the desired structure using Latin characters
        const filePath = `number_${number}/person${participantData[0].id}_var${variationLatin}.wav`;
  
        console.log(`Uploading file: ${filePath}`);
  
        // Upload the file to Supabase Storage
        const uploadPromise = supabase.storage
          .from("recordings")
          .upload(filePath, blob, {
            cacheControl: "3600",
            upsert: false,
          })
          .then(({ data, error }) => {
            if (error) {
              console.error(`Error uploading recording ${key}:`, error);
              throw new Error(
                `Error uploading recording ${key}: ${error.message}`
              );
            }
  
            // Update progress
            completedUploads++;
            setUploadProgress(
              Math.floor(
                (completedUploads / Object.keys(recordingBlobs).length) * 100
              )
            );
  
            return data;
          });
  
        uploadPromises.push(uploadPromise);
      }
  
      // Wait for all uploads to complete
      await Promise.all(uploadPromises);
  
      // Update the participant record to indicate upload completion
      const { error: updateError } = await supabase
        .from("participants")
        .update({ upload_completed: true })
        .eq("id", participantData[0].id);
  
      if (updateError) {
        console.error("Error updating participant record:", updateError);
        throw new Error(`Error updating participant record: ${updateError.message}`);
      }
  
      setIsUploading(false);
      setUploadProgress(100);
      alert("شكرًا لك على مشاركتك! تم تحميل جميع التسجيلات بنجاح.");
  
      // setRecordings({});
      // setRecordingBlobs({});
  
    } catch (error) {
      console.error("Error submitting recordings:", error);
      setIsUploading(false);
      alert(`حدث خطأ أثناء تحميل التسجيلات: ${error.message}`);
    }
  };


  return (
    <div dir="rtl" className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">
          جمع التسجيلات الصوتية
        </h1>

        <div className="bg-blue-100 p-4 rounded-lg mb-6">
          <h2 className="text-xl font-bold mb-2">هدف المشروع</h2>
          <p>
            يهدف هذا المشروع إلى جمع تسجيلات لأرقام من 1 إلى 9 باللغة المزابية،
            وذلك للمساعدة في بناء نموذج ذكاء اصطناعي قادر على التعرف على الأرقام
            منطوقة بهذه اللغة. <br />
            <strong>شكرا مسبقا على دعمنا 😊</strong>
          </p>
        </div>

        <div className="bg-yellow-100 p-4 rounded-lg mb-6">
          <h2 className="text-xl font-bold mb-4">التعليمات:</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              لكل رقم من <strong>1 إلى 9</strong>، قم بتسجيل{" "}
              <strong>3 متغيرات مختلفة</strong> لطريقة نطقك للرقم (
              <strong>أ، ب، ج</strong>).
            </li>
            <li>
              إذا كان بالإمكان، اجعل كل تسجيل مختلفًا قليلًا عن الآخر (
              <strong>همس، صراخ، غناء...</strong>).
            </li>
            <li>
              اضغط على زر <strong>"تسجيل"</strong> لبدء تسجيل الصوت لمتغير معين.
            </li>
            <li>
              أدخل <strong>اسمك وعمرك</strong> في الحقول المخصصة أسفل الصفحة.
            </li>
            <li>
              تأكد أن{" "}
              <strong>الوقت الإجمالي لكل تسجيل لا يتجاوز 3 ثوانٍ</strong>.
            </li>
            <li>
              يمكنك <strong>إعادة التسجيل</strong> إذا لم تكن راضيًا عن النتيجة.
            </li>
            <li>
              يُرجى <strong>الاستماع إلى كل التسجيلات قبل إرسالها</strong>.
            </li>
            <li>
              تأكد من <strong>تسجيل جميع الأرقام والمتغيرات</strong> (
              <strong>الإجمالي: 27 تسجيلًا</strong>).
            </li>
            <li>
              بمجرد <strong>إكمال جميع التسجيلات وإدخال بياناتك</strong>، اضغط
              على زر <strong>"إرسال جميع التسجيلات"</strong> لإرسال بياناتك.
            </li>
            <li>
              تأكد من <strong>السماح للمتصفح بالوصول إلى الميكروفون</strong>،
              وإلا فلن تتمكن من التسجيل.
            </li>
          </ol>
        </div>

        <div className="space-y-6">
          {numbers.map((number) => (
            <div key={number} className="border rounded p-4">
              <h2 className="text-xl font-semibold mb-4">الرقم {number}</h2>
              <div className="space-y-4">
                {variations.map((variation) => {
                  const recordingKey = `${number}-${variation}`;
                  const hasRecording = recordings[recordingKey];
                  const isCurrentlyRecording =
                    isRecording &&
                    currentRecording.number === number &&
                    currentRecording.variation === variation;

                  return (
                    <div
                      key={variation}
                      className="flex items-center space-x-reverse space-x-4"
                    >
                      <span className="text-sm w-24">المتغير {variation}</span>
                      <button
                        onClick={() =>
                          isCurrentlyRecording
                            ? stopRecording()
                            : startRecording(number, variation)
                        }
                        className={`px-4 py-2 rounded min-w-24 ${
                          isCurrentlyRecording
                            ? "bg-red-500 text-white"
                            : hasRecording
                            ? "bg-green-500 text-white"
                            : "bg-blue-500 text-white"
                        }`}
                      >
                        {isCurrentlyRecording
                          ? "إيقاف"
                          : hasRecording
                          ? "إعادة التسجيل"
                          : "تسجيل"}
                      </button>
                      {isCurrentlyRecording && stream && (
                        <VoiceVisualizer stream={stream} />
                      )}
                      {hasRecording && (
                        <audio
                          controls
                          src={recordings[recordingKey]}
                          className="flex-1"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center bg-gray-50 px-4 py-2 rounded-lg mt-6 gap-4">
          <label className="text-sm font-medium text-gray-700 flex items-center">
            العمر:
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="mr-2 w-20 p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
              max="120"
              placeholder="العمر"
            />
          </label>
        </div>

        {isUploading && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-center mt-2">{uploadProgress}% تم التحميل</p>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={handleSubmit}
            disabled={isUploading}
            className={`${
              isUploading ? "bg-gray-400" : "bg-green-500 hover:bg-green-600"
            } text-white px-6 py-2 rounded transition-colors`}
          >
            {isUploading ? "جاري الإرسال..." : "إرسال جميع التسجيلات"}
          </button>
        </div>
      </div>
    </div>
  );
}
