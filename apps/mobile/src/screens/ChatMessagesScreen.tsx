import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { RootStackParamList } from "../navigation/types";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";

type ChatRoute = RouteProp<{ ChatMessages: { employeeId: string; fullName: string } }, "ChatMessages">;

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: { user: { fullName: string } };
}

export default function ChatMessagesScreen() {
  const route = useRoute<ChatRoute>();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { employeeId, fullName } = route.params;
  const flatListRef = useRef<FlatList>(null);
  const [inputText, setInputText] = useState("");

  useEffect(() => {
    navigation.setOptions({ title: fullName });
  }, [fullName, navigation]);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["messages", employeeId],
    queryFn: () => api.get(`/messages/${employeeId}`).then((r) => r.data as Message[]),
  });

  const { data: myProfile } = useQuery({
    queryKey: ["myProfile"],
    queryFn: () => api.get("/users/profile").then((r) => r.data),
  });

  const sentTextRef = useRef("");

  const mutation = useMutation({
    mutationFn: (text: string) =>
      api.post("/messages", { receiverEmployeeId: employeeId, content: text }),
    onSuccess: (res) => {
      queryClient.setQueryData<Message[]>(["messages", employeeId], (old) =>
        old ? [...old, res.data] : [res.data],
      );
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    },
    onError: () => {
      setInputText(sentTextRef.current);
    },
  });

  const handleSend = () => {
    const text = inputText.trim();
    if (!text || mutation.isPending) return;
    sentTextRef.current = text;
    setInputText("");
    mutation.mutate(text);
  };

  const myEmployeeId = myProfile?.employeeId || "";
  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
  };

  const isMyMessage = (msg: Message) => msg.senderId === myEmployeeId;

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => (
          <View style={[styles.messageRow, isMyMessage(item) && styles.myMessageRow]}>
            <View style={[styles.messageBubble, isMyMessage(item) ? styles.myBubble : styles.theirBubble]}>
              <Text style={styles.messageText}>{item.content}</Text>
              <Text style={[styles.messageTime, isMyMessage(item) && styles.myMessageTime]}>
                {formatTime(item.createdAt)}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            title="Hali xabarlar yo'q"
            message="Xabar yozishni boshlang"
          />
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Xabar yozish..."
          placeholderTextColor="#667788"
          multiline
          maxLength={1000}
        />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || mutation.isPending) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={mutation.isPending || !inputText.trim()}
          >
            <Text style={styles.sendText}>{mutation.isPending ? "..." : "→"}</Text>
          </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  messageRow: { paddingHorizontal: 16, paddingVertical: 4, alignItems: "flex-start" },
  myMessageRow: { alignItems: "flex-end" },
  messageBubble: { maxWidth: "75%", borderRadius: 16, padding: 12, paddingBottom: 6 },
  myBubble: { backgroundColor: "#1a73e8", borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: "#16213e", borderBottomLeftRadius: 4 },
  messageText: { color: "#fff", fontSize: 15, lineHeight: 20 },
  messageTime: { color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 4, textAlign: "right" },
  myMessageTime: { color: "rgba(255,255,255,0.6)" },
  inputContainer: {
    flexDirection: "row", padding: 12, borderTopWidth: 1, borderTopColor: "#0f3460",
    backgroundColor: "#16213e", alignItems: "flex-end",
  },
  input: {
    flex: 1, backgroundColor: "#1a1a2e", borderRadius: 20, paddingHorizontal: 16,
    paddingVertical: 10, color: "#fff", fontSize: 15, maxHeight: 100,
  },
  sendButton: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: "#1a73e8",
    justifyContent: "center", alignItems: "center", marginLeft: 8,
  },
  sendButtonDisabled: { opacity: 0.5 },
  sendText: { color: "#fff", fontSize: 20 },
});
