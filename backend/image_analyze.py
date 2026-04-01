from deepface import DeepFace

def analyze_image(image_path):
    try:
        results = DeepFace.analyze(img_path=image_path, actions=['emotion'], enforce_detection=False)

        if not results:
            return {"error": "No face found"}

        output = []
        for res in results:
            emotion = res['dominant_emotion']
            confidence = res['emotion'][emotion]

            emoji_map = {
                "happy": "😊",
                "sad": "😢",
                "angry": "😡",
                "neutral": "😐",
                "surprise": "😲",
                "fear": "😨",
                "disgust": "🤢"
            }

            emoji = emoji_map.get(emotion, "🤔")
            output.append({"emotion": emotion, "emoji": emoji, "confidence": confidence})

        return output

    except Exception as e:
        print("ERROR:", e)
        return {"error": str(e)}





