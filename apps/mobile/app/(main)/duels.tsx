import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, LayoutAnimation, Platform, UIManager, Modal } from "react-native";
import { useState, useRef, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../../src/components/ui/card";
import { Button } from "../../src/components/ui/button";
import { Input } from "../../src/components/ui/input";
import { api, CURRENT_USER_ID } from "../../src/lib/api";
import { LinearGradient } from "expo-linear-gradient";

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default function DuelsScreen() {
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'FINISHED'>('IDLE');
  const [activeTab, setActiveTab] = useState<'ARENA' | 'CHALLENGES' | 'HISTORY'>('ARENA');
  
  // Duelo ativo em jogo
  const [opponent, setOpponent] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userScore, setUserScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [currentDuelId, setCurrentDuelId] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState(true);
  const [finalOpponentScore, setFinalOpponentScore] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const answersRef = useRef<number[]>([]);
  const currentIdxRef = useRef(0);
  const advancingRef = useRef(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Dados carregados do backend
  const [opponents, setOpponents] = useState<any[]>([]);
  const [activeChallenges, setActiveChallenges] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userBalance, setUserBalance] = useState(0);

  // Filtro de disciplina na Arena
  const [activeSubject, setActiveSubject] = useState("Matemática");

  // Estado para Modal de Criação de Desafio
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState<any>(null);
  const [challengeSubject, setChallengeSubject] = useState("Matemática");
  const [challengeBet, setChallengeBet] = useState("0");
  const [challengeDate, setChallengeDate] = useState(""); // formato: AAAA-MM-DD HH:MM

  const fetchData = async (subj: string = activeSubject) => {
    try {
      setLoading(true);
      const [oppRes, pendingRes, histRes, userRes] = await Promise.all([
        api.get(`/duels/opponents?subject=${encodeURIComponent(subj)}`),
        api.get("/duels/pending"),
        api.get("/user/duels"),
        api.get("/user"),
      ]);

      setOpponents(oppRes || []);
      setActiveChallenges(pendingRes || []);
      setHistory(histRes?.duels || []);
      setUserBalance(userRes?.balance || 0);
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activeSubject);
  }, [activeSubject]);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (!advancingRef.current) advanceQuestion(-1);
          return 15;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const advanceQuestion = (choice: number) => {
    if (advancingRef.current) return;
    advancingRef.current = true;

    const idx = currentIdxRef.current;
    const nextAnswers = [...answersRef.current];
    nextAnswers[idx] = choice;
    answersRef.current = nextAnswers;
    setAnswers(nextAnswers);

    setTimeout(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      if (idx < questions.length - 1) {
        const nextIdx = idx + 1;
        currentIdxRef.current = nextIdx;
        setCurrentIdx(nextIdx);
        setSelectedAnswer(null);
        setTimeLeft(15);
        advancingRef.current = false;
      } else {
        if (timerRef.current) clearInterval(timerRef.current);
        finishDuel(nextAnswers);
      }
    }, 400);
  };

  const finishDuel = async (finalAnswers: number[]) => {
    try {
      const data = await api.post(`/duels/${currentDuelId}/finish`, {
        answers: finalAnswers,
      });

      if (typeof data.score === "number") setUserScore(data.score);

      if (data.finished) {
        const d = data.duel;
        const oppSc = isCreator ? d.opponentScore : d.creatorScore;
        setOpponentScore(oppSc !== null ? oppSc : 0);
      } else {
        setOpponentScore(finalOpponentScore !== null ? finalOpponentScore : 0);
      }
    } catch (e) {
      console.error("Erro ao gravar resultado:", e);
    }
    setGameState("FINISHED");
    fetchData();
  };

  const handleSelectOption = (idx: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(idx);
    advanceQuestion(idx);
  };

  const handleOpenChallengeModal = (player: any) => {
    setSelectedOpponent(player);
    setChallengeSubject(activeSubject);
    setChallengeBet("0");
    setChallengeDate("");
    setIsModalVisible(true);
  };

  const handleCreateChallenge = async () => {
    if (!selectedOpponent) return;
    const bet = parseFloat(challengeBet) || 0;

    if (userBalance < bet) {
      Alert.alert("Saldo Insuficiente", `Você tem ${userBalance} MT, mas a aposta é de ${bet} MT.`);
      return;
    }

    try {
      setLoading(true);
      await api.post("/duels/create", {
        opponentId: selectedOpponent.id,
        subject: challengeSubject,
        betAmount: bet,
        scheduledAt: challengeDate ? new Date(challengeDate).toISOString() : null,
      });

      setIsModalVisible(false);
      Alert.alert("Sucesso", `Desafio de ${challengeSubject} enviado para ${selectedOpponent.name}!`);
      fetchData();
    } catch (e: any) {
      Alert.alert("Erro", e.message || "Não foi possível enviar o desafio.");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptChallenge = async (duelId: string) => {
    // Buscar valor da aposta para validação de saldo
    const duel = activeChallenges.find(d => d.id === duelId);
    if (duel && userBalance < duel.betAmount) {
      Alert.alert("Saldo Insuficiente", `A aposta exige ${duel.betAmount} MT, mas você tem ${userBalance} MT.`);
      return;
    }

    try {
      setLoading(true);
      await api.post("/duels/accept", { duelId });
      Alert.alert("Desafio Aceite", "Você aceitou o duelo! Jogue agora clicando em 'Entrar'.");
      fetchData();
    } catch (e: any) {
      Alert.alert("Erro", e.message || "Não foi possível aceitar o desafio.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineChallenge = async (duelId: string) => {
    try {
      setLoading(true);
      await api.post("/duels/decline", { duelId });
      Alert.alert("Desafio Recusado", "Você recusou o convite. O valor apostado foi devolvido ao oponente.");
      fetchData();
    } catch (e) {
      Alert.alert("Erro", "Não foi possível recusar o desafio.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartGame = (duel: any) => {
    const isUserCreator = duel.creatorId === CURRENT_USER_ID;
    const opp = isUserCreator ? duel.opponent : duel.creator;
    const parsed = typeof duel.questions === "string" ? JSON.parse(duel.questions) : duel.questions;
    const initialAnswers = new Array(parsed.length).fill(-1);

    setOpponent({
      name: opp.name,
      avatar: opp.avatar || `https://ui-avatars.com/api/?name=${opp.name}&background=181B30&color=5B6EF5`
    });
    setQuestions(parsed);
    setCurrentDuelId(duel.id);
    setIsCreator(isUserCreator);
    setFinalOpponentScore(isUserCreator ? duel.opponentScore : duel.creatorScore);
    answersRef.current = initialAnswers;
    setAnswers(initialAnswers);
    currentIdxRef.current = 0;
    advancingRef.current = false;

    setGameState('PLAYING');
    setCurrentIdx(0);
    setUserScore(0);
    setOpponentScore(0);
    setSelectedAnswer(null);
    setTimeLeft(15);
    startTimer();
  };

  const getInitials = (name: string) => {
    if (!name) return "SO";
    const parts = name.split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const renderArena = () => (
    <ScrollView className="flex-1 px-4 py-6" showsVerticalScrollIndicator={false}>
      <Card className="bg-sophia-card border-sophia-border p-6 mb-8 overflow-hidden rounded-[24px]">
        <View className="flex-row justify-between items-center mb-6">
           <View className="items-center">
              <View className="h-16 w-16 rounded-2xl bg-sophia-primary/20 border-2 border-sophia-primary items-center justify-center">
                 <Text className="text-sophia-text font-black text-xl">EU</Text>
              </View>
           </View>

           <View className="bg-sophia-danger/20 px-4 py-2 rounded-full border border-sophia-danger/30">
              <Text className="text-sophia-danger font-black text-xs">VS</Text>
           </View>

           <View className="items-center">
              <View className="h-16 w-16 rounded-2xl bg-sophia-bg3 border-2 border-sophia-border items-center justify-center border-dashed">
                 <Ionicons name="people" size={30} color="#5A6494" />
              </View>
           </View>
        </View>
        <Text className="text-sophia-text3 text-center text-xs px-2 mb-4 leading-relaxed">
          Escolha um adversário ativo abaixo para desafiá-lo para um duelo de mentes com aposta de saldo (MT).
        </Text>
        <View className="bg-sophia-bg3 px-4 py-2.5 rounded-full border border-sophia-border items-center">
           <Text className="text-[10px] font-bold text-sophia-accent2">Teu Saldo: {userBalance} MT</Text>
        </View>
      </Card>

      <Text className="text-xs font-bold text-sophia-text3 mb-2 uppercase">Filtrar por Disciplina</Text>
      <View className="flex-row flex-wrap gap-2 mb-6">
        {["Matemática", "Física", "Química", "Biologia"].map((sub) => (
          <TouchableOpacity 
            key={sub}
            onPress={() => setActiveSubject(sub)}
            className={`px-4 py-2.5 rounded-xl border ${
              activeSubject === sub 
                ? 'bg-sophia-primary/10 border-sophia-primary' 
                : 'bg-sophia-card border-sophia-border'
            }`}
          >
            <Text className={`text-xs font-bold ${
              activeSubject === sub ? 'text-sophia-primary2' : 'text-sophia-text2'
            }`}>{sub}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text className="text-lg font-bold text-sophia-text mb-4" style={{ fontFamily: 'Syne' }}>
        Alunos Ativos em {activeSubject}
      </Text>

      {opponents.length === 0 ? (
        <View className="bg-sophia-card p-8 rounded-2xl border border-sophia-border items-center">
          <Text className="text-sophia-text3 italic">Nenhum oponente disponível para {activeSubject} no momento.</Text>
        </View>
      ) : (
        <View className="gap-3 mb-8">
          {opponents.map((player) => (
            <TouchableOpacity 
              key={player.id} 
              onPress={() => handleOpenChallengeModal(player)}
              className="flex-row items-center bg-sophia-card p-4 rounded-2xl border border-sophia-border"
            >
              <LinearGradient colors={['#2E3560', '#252A45']} className="h-10 w-10 rounded-xl items-center justify-center mr-4">
                <Text className="text-white font-bold text-xs">{getInitials(player.name)}</Text>
              </LinearGradient>
              <View className="flex-1">
                <Text className="font-bold text-sophia-text text-sm">{player.name}</Text>
                <Text className="text-sophia-text3 text-[10px] font-bold uppercase">{player.reputation} reputação</Text>
              </View>
              <View className="flex-row items-center gap-1.5 bg-sophia-primary/10 px-3 py-1.5 rounded-xl border border-sophia-primary/20">
                <Text className="text-sophia-primary2 text-[10px] font-bold">DESAFIAR</Text>
                <Ionicons name="chevron-forward" size={10} color="#5B6EF5" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderChallenges = () => (
    <ScrollView className="flex-1 px-4 py-6" showsVerticalScrollIndicator={false}>
      <Text className="text-lg font-bold text-sophia-text mb-4" style={{ fontFamily: 'Syne' }}>Desafios e Convites</Text>

      {activeChallenges.length === 0 ? (
        <View className="bg-sophia-card p-10 rounded-3xl border border-sophia-border items-center justify-center mt-6">
          <Ionicons name="mail-open-outline" size={40} color="#252A45" className="mb-4" />
          <Text className="text-sophia-text3 italic text-center">Nenhum convite pendente ou duelo ativo no momento.</Text>
        </View>
      ) : (
        <View className="gap-4 mb-8">
          {activeChallenges.map((duel) => {
            const isMeCreator = duel.creatorId === CURRENT_USER_ID;
            const oppName = isMeCreator ? duel.opponent.name : duel.creator.name;
            const isPending = duel.status === 'PENDING';
            const isAccepted = duel.status === 'ACCEPTED';
            
            return (
              <Card key={duel.id} className="bg-sophia-card border-sophia-border p-4 rounded-3xl">
                <View className="flex-row justify-between items-start mb-3">
                  <View>
                    <Text className="font-bold text-sophia-text text-sm">{duel.subject}</Text>
                    <Text className="text-[10px] text-sophia-text3 mt-0.5">
                      {isMeCreator ? `Desafio enviado para: ${oppName}` : `Desafio de: ${oppName}`}
                    </Text>
                  </View>
                  <View className="bg-sophia-bg3 px-2.5 py-1 rounded-full border border-sophia-border">
                    <Text className={`text-[8px] font-black uppercase ${
                      isPending ? 'text-sophia-accent2' : 'text-sophia-accent'
                    }`}>{duel.status}</Text>
                  </View>
                </View>

                <View className="bg-sophia-bg3 p-3 rounded-2xl mb-4 gap-1">
                  <Text className="text-[10px] text-sophia-text2">💰 Aposta: <Text className="font-bold text-sophia-accent">{duel.betAmount} MT</Text></Text>
                  {duel.scheduledAt && (
                    <Text className="text-[10px] text-sophia-text2">📅 Agendado para: <Text className="font-bold">{new Date(duel.scheduledAt).toLocaleString()}</Text></Text>
                  )}
                </View>

                <View className="flex-row gap-2 justify-end">
                  {/* Se for oponente e o status for PENDING, aceitar ou recusar */}
                  {!isMeCreator && isPending && (
                    <>
                      <Button 
                        label="Recusar" 
                        variant="destructive"
                        size="sm"
                        className="px-4"
                        onPress={() => handleDeclineChallenge(duel.id)}
                      />
                      <Button 
                        label="Aceitar" 
                        size="sm"
                        className="bg-sophia-accent px-4"
                        onPress={() => handleAcceptChallenge(duel.id)}
                      />
                    </>
                  )}

                  {/* Se for criador e o status for PENDING, apenas aguarda */}
                  {isMeCreator && isPending && (
                    <Text className="text-[10px] text-sophia-text3 italic py-2">Aguardando resposta do oponente...</Text>
                  )}

                  {/* Se o duelo já estiver ACCEPTED, ambos podem entrar para jogar */}
                  {isAccepted && (
                    <Button 
                      label="Entrar na Arena" 
                      size="sm"
                      className="bg-sophia-primary px-6"
                      onPress={() => handleStartGame(duel)}
                    />
                  )}
                </View>
              </Card>
            );
          })}
        </View>
      )}
    </ScrollView>
  );

  const renderHistory = () => (
    <ScrollView className="flex-1 px-4 py-6" showsVerticalScrollIndicator={false}>
      <Text className="text-lg font-bold text-sophia-text mb-4" style={{ fontFamily: 'Syne' }}>Batalhas Passadas</Text>

      {history.length === 0 ? (
        <View className="bg-sophia-card p-8 rounded-2xl border border-sophia-border items-center">
          <Text className="text-sophia-text3 italic">Você ainda não completou nenhum duelo.</Text>
        </View>
      ) : (
        <View className="gap-3 mb-8">
          {history.map((duel) => (
            <View key={duel.id} className="flex-row items-center bg-sophia-card p-4 rounded-2xl border border-sophia-border">
              <View className={`h-9 w-9 rounded-full items-center justify-center mr-4 ${
                duel.type === 'WIN' ? 'bg-sophia-accent/10 border border-sophia-accent/20' : 
                duel.type === 'LOSS' ? 'bg-sophia-danger/10 border border-sophia-danger/20' : 
                'bg-sophia-bg3 border border-sophia-border'
              }`}>
                <Ionicons 
                  name={duel.type === 'WIN' ? "trophy" : duel.type === 'LOSS' ? "close" : "git-compare"} 
                  size={18} 
                  color={duel.type === 'WIN' ? "#00C9A7" : duel.type === 'LOSS' ? "#F55B7A" : "#F5A623"} 
                />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-sophia-text text-sm">vs {duel.opponentName}</Text>
                <Text className="text-sophia-text3 text-[9px] mt-0.5">{new Date(duel.createdAt).toLocaleDateString()}</Text>
              </View>
              <View className="items-end">
                <Text className="font-head font-extrabold text-sm text-sophia-text">{duel.userScore} - {duel.oppScore}</Text>
                <Text className={`text-[8px] font-bold mt-0.5 ${
                  duel.type === 'WIN' ? 'text-sophia-accent' : 
                  duel.type === 'LOSS' ? 'text-sophia-danger' : 
                  'text-sophia-accent2'
                }`}>{duel.type}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderPlaying = () => {
    const q = questions[currentIdx];
    if (!q) return null;

    return (
      <View className="flex-1 p-4 mt-6">
        <View className="flex-row justify-between items-center mb-6 bg-sophia-card border border-sophia-border p-4 rounded-3xl">
           <View className="items-center flex-1">
              <View className="h-12 w-12 rounded-xl bg-sophia-primary/20 border border-sophia-primary items-center justify-center mb-1">
                <Text className="text-sophia-text font-bold">EU</Text>
              </View>
              <Text className="text-sophia-text font-black text-xl">{userScore}</Text>
           </View>

           <View className="items-center px-4">
              <Text className={`text-2xl font-black ${timeLeft < 5 ? 'text-sophia-danger' : 'text-sophia-accent2'}`} style={{ fontFamily: 'Syne' }}>{timeLeft}s</Text>
              <View className="w-16 h-1 bg-sophia-bg3 rounded-full mt-1 overflow-hidden">
                <View className="h-full bg-sophia-accent2" style={{ width: `${(timeLeft/15)*100}%` }} />
              </View>
           </View>

           <View className="items-center flex-1">
              <View className="h-12 w-12 rounded-xl bg-sophia-danger/10 border border-sophia-danger/30 items-center justify-center mb-1 overflow-hidden">
                {opponent?.avatar ? (
                  <Image source={{ uri: opponent.avatar }} className="h-full w-full" />
                ) : (
                  <Ionicons name="help" size={24} color="#F55B7A" />
                )}
              </View>
              <Text className="text-sophia-danger font-black text-xl">?</Text>
           </View>
        </View>

        <Card className="bg-sophia-card border-sophia-border p-6 mb-6">
           <Text className="text-sophia-primary2 text-[10px] font-bold uppercase mb-2">Questão {currentIdx + 1} de {questions.length}</Text>
           <Text className="text-sophia-text text-[15px] font-medium leading-[1.6]">
             {q.question}
           </Text>
        </Card>

        <View className="gap-3">
          {q.options.map((opt: string, i: number) => (
            <TouchableOpacity 
              key={i} 
              onPress={() => handleSelectOption(i)}
              disabled={selectedAnswer !== null}
              className={`flex-row items-center gap-4 p-5 rounded-2xl border ${
                selectedAnswer === i
                  ? 'bg-sophia-primary/10 border-sophia-primary'
                  : 'bg-sophia-card border-sophia-border'
              }`}
            >
              <View className={`h-8 w-8 rounded-lg items-center justify-center ${
                selectedAnswer === i ? 'bg-sophia-primary' : 'bg-sophia-bg3'
              }`}>
                <Text className="text-white font-black">{'ABCD'[i]}</Text>
              </View>
              <Text className="flex-1 text-sophia-text font-medium">{opt}</Text>
              {selectedAnswer === i && <Ionicons name="checkmark-circle" size={20} color="#5B6EF5" />}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderFinished = () => {
    if (isCreator && finalOpponentScore === null) {
      return (
        <View className="flex-1 items-center justify-center p-6">
          <View className="h-32 w-32 rounded-full bg-sophia-primary/20 border-4 border-sophia-primary items-center justify-center mb-6">
             <Ionicons name="time" size={60} color="#5B6EF5" />
          </View>
          <Text className="text-sophia-text font-black text-2xl mb-2 text-center" style={{ fontFamily: 'Syne' }}>
             Respostas Gravadas!
          </Text>
          <Text className="text-sophia-text3 text-center mb-8 px-4 leading-relaxed">
             Fizeste {userScore} pontos! Como o duelo é agendado/assíncrono, estamos a aguardar a finalização do oponente. Serás notificado com o resultado final!
          </Text>
          <Button 
            label="Voltar para Arena" 
            className="w-full bg-sophia-primary h-14"
            onPress={() => setGameState('IDLE')} 
          />
        </View>
      );
    }

    const win = userScore > opponentScore;
    const draw = userScore === opponentScore;

    return (
      <View className="flex-1 items-center justify-center p-6">
        <View className={`h-32 w-32 rounded-full items-center justify-center mb-6 ${win ? 'bg-sophia-accent/20 border-4 border-sophia-accent' : draw ? 'bg-sophia-accent2/20 border-4 border-sophia-accent2' : 'bg-sophia-danger/20 border-4 border-sophia-danger'}`}>
           <Ionicons name={win ? "trophy" : draw ? "git-compare" : "sad-outline"} size={60} color={win ? "#00C9A7" : draw ? "#F5A623" : "#F55B7A"} />
        </View>

        <Text className="text-sophia-text font-black text-3xl mb-2" style={{ fontFamily: 'Syne' }}>
           {win ? 'VITÓRIA!' : draw ? 'EMPATE!' : 'DERROTA'}
        </Text>
        <Text className="text-sophia-text3 text-center mb-8 px-8 leading-relaxed">
           {win ? `Esplêndido! Venceste ${opponent?.name} e arrecadaste o prêmio!` : draw ? 'Uma batalha épica de mentes iguais.' : `${opponent?.name} levou a melhor desta vez.`}
        </Text>

        <View className="flex-row gap-4 mb-8">
           <View className="flex-1 bg-sophia-card p-4 rounded-3xl border border-sophia-border items-center">
              <Text className="text-sophia-text font-black text-2xl">{userScore}</Text>
              <Text className="text-sophia-text3 text-[10px] font-bold uppercase">Teu Score</Text>
           </View>
           <View className="flex-1 bg-sophia-card p-4 rounded-3xl border border-sophia-border items-center">
              <Text className="text-sophia-danger font-black text-2xl">{opponentScore}</Text>
              <Text className="text-sophia-text3 text-[10px] font-bold uppercase">{opponent?.name?.split(' ')[0] || 'Oponente'}</Text>
           </View>
        </View>

        <Button 
          label="Voltar para Arena" 
          className="w-full bg-sophia-primary h-14"
          onPress={() => setGameState('IDLE')} 
        />
      </View>
    );
  };

  return (
    <View className="flex-1 bg-sophia-bg">
      {gameState === 'IDLE' && (
        <View className="flex-1">
          {/* Tabs customizadas */}
          <View className="flex-row p-4 gap-4 mt-6">
            <TouchableOpacity 
              onPress={() => setActiveTab('ARENA')}
              className={`flex-1 py-3 rounded-2xl border ${activeTab === 'ARENA' ? 'bg-sophia-primary/10 border-sophia-primary' : 'bg-sophia-card border-sophia-border'}`}
            >
              <Text className={`text-center font-bold text-xs ${activeTab === 'ARENA' ? 'text-sophia-primary2' : 'text-sophia-text2'}`}>Arena (Desafiar)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => setActiveTab('CHALLENGES')}
              className={`flex-1 py-3 rounded-2xl border ${activeTab === 'CHALLENGES' ? 'bg-sophia-primary/10 border-sophia-primary' : 'bg-sophia-card border-sophia-border'}`}
            >
              <View className="flex-row items-center justify-center gap-2">
                <Text className={`text-center font-bold text-xs ${activeTab === 'CHALLENGES' ? 'text-sophia-primary2' : 'text-sophia-text2'}`}>Convites</Text>
                {activeChallenges.filter(c => c.status === 'PENDING' && c.opponentId === CURRENT_USER_ID).length > 0 && (
                  <View className="bg-sophia-danger h-4 w-4 rounded-full items-center justify-center">
                    <Text className="text-white text-[8px] font-bold">
                      {activeChallenges.filter(c => c.status === 'PENDING' && c.opponentId === CURRENT_USER_ID).length}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setActiveTab('HISTORY')}
              className={`flex-1 py-3 rounded-2xl border ${activeTab === 'HISTORY' ? 'bg-sophia-primary/10 border-sophia-primary' : 'bg-sophia-card border-sophia-border'}`}
            >
              <Text className={`text-center font-bold text-xs ${activeTab === 'HISTORY' ? 'text-sophia-primary2' : 'text-sophia-text2'}`}>Histórico</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#5B6EF5" />
            </View>
          ) : (
            <>
              {activeTab === 'ARENA' && renderArena()}
              {activeTab === 'CHALLENGES' && renderChallenges()}
              {activeTab === 'HISTORY' && renderHistory()}
            </>
          )}
        </View>
      )}

      {gameState === 'PLAYING' && renderPlaying()}
      {gameState === 'FINISHED' && renderFinished()}

      {/* Modal para configurar Desafio Direto */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/70">
          <View className="bg-sophia-bg2 rounded-t-[40px] p-8 border-t border-sophia-border">
            <View className="items-center mb-6">
              <View className="w-12 h-1.5 bg-sophia-border rounded-full mb-6" />
              <Text className="text-2xl font-bold text-sophia-text">Criar Desafio</Text>
            </View>

            {selectedOpponent && (
              <View className="mb-6">
                <View className="flex-row items-center gap-4 bg-sophia-card p-5 rounded-3xl border border-sophia-border mb-4">
                  <LinearGradient colors={['#2E3560', '#252A45']} className="h-10 w-10 rounded-xl items-center justify-center">
                    <Text className="text-white font-bold text-xs">{getInitials(selectedOpponent.name)}</Text>
                  </LinearGradient>
                  <View className="flex-1">
                    <Text className="font-bold text-sophia-text text-sm">{selectedOpponent.name}</Text>
                    <Text className="text-xs text-sophia-text3">{selectedOpponent.reputation} reputação</Text>
                  </View>
                </View>

                {/* Seleção de Disciplina */}
                <Text className="text-xs font-bold text-sophia-text3 mb-2 uppercase">Disciplina</Text>
                <View className="flex-row flex-wrap gap-2 mb-4">
                  {["Matemática", "Física", "Química", "Biologia"].map((sub) => (
                    <TouchableOpacity 
                      key={sub}
                      onPress={() => setChallengeSubject(sub)}
                      className={`px-4 py-2.5 rounded-xl border ${
                        challengeSubject === sub 
                          ? 'bg-sophia-primary/10 border-sophia-primary' 
                          : 'bg-sophia-card border-sophia-border'
                      }`}
                    >
                      <Text className={`text-xs font-bold ${
                        challengeSubject === sub ? 'text-sophia-primary2' : 'text-sophia-text2'
                      }`}>{sub}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Aposta em Dinheiro */}
                <Input 
                  label="Valor da Aposta (MT)"
                  placeholder="Ex: 100"
                  keyboardType="numeric"
                  value={challengeBet}
                  onChangeText={setChallengeBet}
                  containerClassName="mb-4"
                />

                {/* Agendamento de Horário */}
                <Input 
                  label="Data/Hora Agendada (Opcional)"
                  placeholder="Ex: 2026-07-08 15:00"
                  value={challengeDate}
                  onChangeText={setChallengeDate}
                  containerClassName="mb-4"
                />
              </View>
            )}

            <View className="flex-row gap-4 mb-4">
              <Button 
                label="Voltar" 
                variant="outline" 
                className="flex-1 border-sophia-border" 
                textClassName="text-sophia-text2"
                onPress={() => setIsModalVisible(false)} 
              />
              <Button 
                label="Desafiar Agora" 
                className="flex-1 bg-sophia-primary shadow-sophia-primary/40" 
                onPress={handleCreateChallenge} 
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
