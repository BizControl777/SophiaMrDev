import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, TextInput, ActivityIndicator } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../src/lib/api";

export default function ExamsScreen() {
  const [step, setStep] = useState(1);
  const [theme, setTheme] = useState("Matemática");
  const [topic, setTopic] = useState("Álgebra");
  const [difficulty, setDifficulty] = useState("Médio");
  const [examSize, setExamSize] = useState(40);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedExam, setGeneratedExam] = useState<any>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  const recentExams = [
    { title: "Matemática — Álgebra", meta: "15 questões · 45min", score: "92%", color: "#00C9A7", time: "há 2h" },
    { title: "Física — Mecânica", meta: "10 questões · 30min", score: "78%", color: "#F5A623", time: "ontem" },
    { title: "Química — Orgânica", meta: "20 questões · 60min", score: "65%", color: "#F55B7A", time: "3 dias" },
  ];

  const handleGenerate = async () => {
    if (!theme || !topic) return;
    setIsGenerating(true);
    try {
      const data = await api.post("/exames/generate", {
        theme: `${theme} - ${topic} (Nível: ${difficulty})`,
        count: examSize,
      });
      setGeneratedExam(data);
      setAnswers(new Array(data.questions.length).fill(-1));
      setCurrentQuestionIdx(0);
      setStep(2);
    } catch (error) {
      console.error("Erro ao gerar exame:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-sophia-bg">
      {/* Header */}
      <View className="h-14 bg-sophia-bg2 border-b border-sophia-border flex-row items-center px-4 justify-between">
        <Text className="text-sophia-text font-head font-bold text-base">Exames</Text>
        <TouchableOpacity className="w-9 h-9 bg-sophia-card border border-sophia-border rounded-xl items-center justify-center">
          <Ionicons name="history" size={18} color="#9BA3CC" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        <View className="mb-6">
          <Text className="text-sophia-text font-head font-bold text-xl">📝 Exames</Text>
          <Text className="text-sophia-text2 text-xs mt-1">Gere e realize exames personalizados</Text>
        </View>

        {/* Steps */}
        <View className="flex-row bg-sophia-card border border-sophia-border rounded-2xl overflow-hidden mb-6">
          {[
            { id: 1, label: "Configurar" },
            { id: 2, label: "Realizar" },
            { id: 3, label: "Resultado" },
          ].map((s) => (
            <TouchableOpacity 
              key={s.id} 
              onPress={() => setStep(s.id)}
              disabled={s.id !== 1 && !generatedExam}
              className={`flex-1 py-3 items-center border-r border-sophia-border last:border-r-0 ${step === s.id ? 'bg-sophia-primary/10' : ''} ${s.id !== 1 && !generatedExam ? 'opacity-40' : ''}`}
            >
              <Text className={`font-head font-bold text-lg leading-none ${step === s.id ? 'text-sophia-primary2' : 'text-sophia-text3'}`}>{s.id}</Text>
              <Text className={`text-[10px] mt-1 ${step === s.id ? 'text-sophia-primary2 font-semibold' : 'text-sophia-text3'}`}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {step === 1 && (
          <>
            {/* Config Card */}
            <View className="bg-sophia-card border border-sophia-border rounded-2xl p-4 mb-6">
              <Text className="text-sophia-text font-head font-bold text-[13px] mb-4">Configurar Novo Exame</Text>
              
              <View className="mb-4">
                <Text className="text-sophia-text2 text-[11px] font-medium mb-1.5 ml-1">Disciplina</Text>
                <View className="bg-sophia-bg3 border border-sophia-border rounded-xl px-4 py-1">
                  <TextInput 
                    className="text-sophia-text text-sm py-2" 
                    value={theme}
                    onChangeText={setTheme}
                    placeholder="Ex: Matemática"
                    placeholderTextColor="#5A6494"
                  />
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-sophia-text2 text-[11px] font-medium mb-1.5 ml-1">Tema</Text>
                <View className="bg-sophia-bg3 border border-sophia-border rounded-xl px-4 py-1">
                  <TextInput 
                    className="text-sophia-text text-sm py-2" 
                    value={topic}
                    onChangeText={setTopic}
                    placeholder="Ex: Álgebra"
                    placeholderTextColor="#5A6494"
                  />
                </View>
              </View>

              <View className="mb-6">
                <Text className="text-sophia-text2 text-[11px] font-medium mb-2.5 ml-1">Nível de Dificuldade</Text>
                <View className="flex-row space-x-2 gap-2">
                  {[
                    { label: "🟢 Fácil", value: "Fácil" },
                    { label: "🟡 Médio", value: "Médio" },
                    { label: "🔴 Difícil", value: "Difícil" },
                  ].map((diff, i) => {
                    const active = difficulty === diff.value;
                    return (
                      <TouchableOpacity 
                        key={i} 
                        onPress={() => setDifficulty(diff.value)}
                        className={`flex-1 py-3 rounded-xl border items-center ${active ? 'bg-sophia-accent/10 border-sophia-accent' : 'bg-sophia-bg3 border-sophia-border'}`}
                      >
                        <Text className={`text-[12px] ${active ? 'text-sophia-accent font-bold' : 'text-sophia-text2'}`}>{diff.label}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>

              <View className="mb-6">
                <Text className="text-sophia-text2 text-[11px] font-medium mb-2.5 ml-1">Formato do Exame</Text>
                <View className="flex-row space-x-2 gap-2">
                  {[
                    { label: "Rápido", value: 5, desc: "5 Qs" },
                    { label: "Teste", value: 20, desc: "20 Qs" },
                    { label: "Admissão", value: 40, desc: "40 Qs" },
                  ].map((size, i) => {
                    const active = examSize === size.value;
                    return (
                      <TouchableOpacity 
                        key={i} 
                        onPress={() => setExamSize(size.value)}
                        className={`flex-1 py-2 rounded-xl border items-center justify-center ${active ? 'bg-sophia-primary/20 border-sophia-primary' : 'bg-sophia-bg3 border-sophia-border'}`}
                      >
                        <Text className={`text-[12px] font-bold ${active ? 'text-sophia-primary' : 'text-sophia-text2'}`}>{size.label}</Text>
                        <Text className={`text-[9px] mt-0.5 ${active ? 'text-sophia-primary' : 'text-sophia-text3'}`}>{size.desc}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>

              <TouchableOpacity 
                onPress={handleGenerate}
                disabled={isGenerating}
                className={`py-4 rounded-2xl items-center shadow-lg ${isGenerating ? 'bg-sophia-primary/50' : 'bg-sophia-primary shadow-sophia-primary/20'}`}
              >
                {isGenerating ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold text-base">⚡ Gerar Exame com IA</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Recent Exams */}
            <View className="bg-sophia-card border border-sophia-border rounded-2xl p-4 mb-8">
              <Text className="text-sophia-text font-head font-bold text-[13px] mb-4">Exames Recentes</Text>
              {recentExams.map((exam, idx) => (
                <View key={idx} className={`flex-row items-center py-3.5 ${idx !== 2 ? 'border-b border-sophia-border' : ''}`}>
                  <View className="flex-1">
                    <Text className="text-sophia-text text-[13px] font-semibold">{exam.title}</Text>
                    <Text className="text-sophia-text3 text-[11px] mt-1">{exam.meta}</Text>
                  </View>
                  <View className="items-end">
                    <Text style={{ color: exam.color }} className="font-head font-bold text-base">{exam.score}</Text>
                    <Text className="text-sophia-text3 text-[10px] mt-1">{exam.time}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {step === 2 && generatedExam && (
          <View className="bg-sophia-card border border-sophia-border rounded-2xl p-5 mb-8">
            <Text className="text-sophia-text font-head font-bold text-lg mb-2">{generatedExam.title}</Text>
            <Text className="text-sophia-text2 text-xs mb-6">Questão {currentQuestionIdx + 1} de {generatedExam.questions.length}</Text>

            <Text className="text-white text-sm leading-relaxed mb-6 font-medium">
              {generatedExam.questions[currentQuestionIdx].question}
            </Text>

            <View className="gap-3 mb-6">
              {generatedExam.questions[currentQuestionIdx].options.map((opt: string, idx: number) => {
                const isSelected = answers[currentQuestionIdx] === idx;
                return (
                  <TouchableOpacity 
                    key={idx}
                    onPress={() => {
                      const newAnswers = [...answers];
                      newAnswers[currentQuestionIdx] = idx;
                      setAnswers(newAnswers);
                    }}
                    className={`p-4 rounded-xl border ${isSelected ? 'bg-sophia-primary/20 border-sophia-primary' : 'bg-sophia-bg3 border-sophia-border'}`}
                  >
                    <Text className={`text-sm ${isSelected ? 'text-sophia-primary font-bold' : 'text-sophia-text'}`}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View className="flex-row gap-4">
              <TouchableOpacity 
                disabled={currentQuestionIdx === 0}
                onPress={() => setCurrentQuestionIdx(prev => prev - 1)}
                className={`flex-1 py-3 items-center rounded-xl border border-sophia-border ${currentQuestionIdx === 0 ? 'opacity-50' : ''}`}
              >
                <Text className="text-sophia-text">Anterior</Text>
              </TouchableOpacity>

              {currentQuestionIdx < generatedExam.questions.length - 1 ? (
                <TouchableOpacity 
                  onPress={() => setCurrentQuestionIdx(prev => prev + 1)}
                  className="flex-1 py-3 items-center rounded-xl bg-sophia-primary"
                >
                  <Text className="text-white font-bold">Próxima</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  onPress={() => setStep(3)}
                  className="flex-1 py-3 items-center rounded-xl bg-sophia-accent"
                >
                  <Text className="text-white font-bold">Finalizar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {step === 3 && generatedExam && (
          <View className="bg-sophia-card border border-sophia-border rounded-2xl p-5 mb-8 items-center">
            <Ionicons name="checkmark-circle" size={60} color="#00C9A7" />
            <Text className="text-sophia-text font-head font-bold text-xl mt-4">Exame Concluído!</Text>
            
            <View className="bg-sophia-bg3 w-full p-4 rounded-xl mt-6 items-center border border-sophia-border">
              <Text className="text-white text-4xl font-bold text-sophia-accent">
                {answers.filter((a, i) => a === generatedExam.questions[i].correctAnswer).length} / {generatedExam.questions.length}
              </Text>
              <Text className="text-sophia-text2 text-xs mt-1">respostas corretas</Text>
            </View>

            <TouchableOpacity 
              onPress={() => {
                setStep(1);
                setGeneratedExam(null);
                setAnswers([]);
              }}
              className="mt-8 w-full py-4 bg-sophia-primary rounded-xl items-center"
            >
              <Text className="text-white font-bold text-base">Voltar ao Início</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
