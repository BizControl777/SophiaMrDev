import { View, Text, ScrollView, RefreshControl, Image, Alert, Modal, ActivityIndicator, TouchableOpacity, Linking } from "react-native";
import { useState, useEffect } from "react";
import { Card, CardContent } from "../../src/components/ui/card";
import { Button } from "../../src/components/ui/button";
import { Input } from "../../src/components/ui/input";
import { Ionicons } from "@expo/vector-icons";
import { api, CURRENT_USER_ID } from "../../src/lib/api";

export default function TeachersScreen() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [requestDescription, setRequestDescription] = useState("");
  const [userBalance, setUserBalance] = useState(0);
  const [activeTab, setActiveTab] = useState<'EXPLORE' | 'REQUESTS' | 'TEACHER_VIEW'>('EXPLORE');
  const [userRole, setUserRole] = useState<'STUDENT' | 'TEACHER' | 'ADMIN'>('STUDENT');

  const fetchData = async () => {
    try {
      const [teachersData, userData, studentRequests, teacherRequests] = await Promise.all([
        api.get("/teachers"),
        api.get(`/user?userId=${CURRENT_USER_ID}`),
        api.get(`/lessons?userId=${CURRENT_USER_ID}&role=STUDENT`),
        api.get(`/lessons?userId=${CURRENT_USER_ID}&role=TEACHER`)
      ]);
      setTeachers(teachersData);
      setUserBalance(userData.balance);
      setUserRole(userData.role);
      
      // Se for professor, mostra as solicitações recebidas, senão as enviadas
      setRequests(userData.role === 'TEACHER' ? teacherRequests : studentRequests);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleRequestHelp = (teacher: any) => {
    if (teacher.status === 'offline') {
      Alert.alert("Indisponivel", "Este professor nao esta online no momento.");
      return;
    }
    
    if (userBalance < teacher.price) {
      Alert.alert("Saldo Insuficiente", `Voce tem ${userBalance} MT, mas a aula custa ${teacher.price} MT.`);
      return;
    }

    setSelectedTeacher(teacher);
    setRequestDescription("");
    setIsModalVisible(true);
  };

  const confirmRequest = async () => {
    if (!requestDescription.trim()) {
      Alert.alert("Atenção", "Por favor, descreva o que você deseja aprender.");
      return;
    }

    try {
      await api.post("/lessons", {
        studentId: CURRENT_USER_ID,
        teacherId: selectedTeacher.id,
        subject: selectedTeacher.subject,
        description: requestDescription,
        price: selectedTeacher.price,
      });

      Alert.alert(
        "Solicitacao Enviada",
        `Sua solicitacao para ${selectedTeacher.name} foi enviada com sucesso! O valor de ${selectedTeacher.price} MT foi retido.`,
        [{ text: "OK", onPress: () => {
          setIsModalVisible(false);
          setActiveTab('REQUESTS');
          fetchData(); 
        }}]
      );
    } catch (error) {
      Alert.alert("Erro", "Nao foi possivel enviar a solicitacao. Tente novamente.");
    }
  };

  const handleLessonAction = async (lessonId: string, action: 'ACCEPTED' | 'REJECTED' | 'COMPLETED') => {
    const actionLabel = action === 'ACCEPTED' ? 'aceitar' : action === 'REJECTED' ? 'rejeitar/cancelar' : 'concluir';
    
    Alert.alert(
      "Confirmar Ação",
      `Deseja realmente ${actionLabel} esta aula?`,
      [
        { text: "Não" },
        { 
          text: "Sim", 
          onPress: async () => {
            try {
              await api.patch("/lessons", { lessonId, status: action });
              fetchData();
            } catch (error) {
              Alert.alert("Erro", `Não foi possível ${actionLabel}.`);
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PENDING': return 'text-sophia-accent2';
      case 'ACCEPTED': return 'text-sophia-accent';
      case 'REJECTED': return 'text-sophia-danger';
      case 'COMPLETED': return 'text-sophia-primary';
      default: return 'text-sophia-text2';
    }
  };

  const renderStudentView = () => (
    <View className="pb-6">
      <View className="flex-row justify-between items-center mb-6 px-4">
        <Text className="text-xs text-sophia-text2">
          Especialistas prontos para te ajudar.
        </Text>
        <View className="bg-sophia-card px-3 py-1 rounded-full border border-sophia-border">
          <Text className="text-[10px] font-bold text-sophia-primary2">Saldo: {userBalance} MT</Text>
        </View>
      </View>

      <View className="gap-4 px-4">
        {loading ? (
          <ActivityIndicator color="#5B6EF5" className="py-10" />
        ) : teachers.length === 0 ? (
          <View className="bg-sophia-card p-10 rounded-3xl border border-sophia-border items-center">
              <Ionicons name="people-outline" size={40} color="#252A45" />
              <Text className="text-center text-sophia-text3 mt-4 italic">Nenhum professor encontrado.</Text>
          </View>
        ) : (
          teachers.map((teacher) => (
            <Card key={teacher.id} className="bg-sophia-card border-sophia-border overflow-hidden">
              <CardContent className="p-0">
                <View className="flex-row p-4 gap-4">
                  <View className="relative">
                    <Image 
                      source={{ uri: teacher.image || `https://ui-avatars.com/api/?name=${teacher.name}&background=181B30&color=5B6EF5` }} 
                      className="h-16 w-16 rounded-2xl bg-sophia-bg3"
                    />
                    <View className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-sophia-card ${
                      teacher.status === 'online' ? 'bg-sophia-accent' : 'bg-sophia-text3'
                    }`} />
                  </View>

                  <View className="flex-1">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="font-bold text-sophia-text text-lg">{teacher.name}</Text>
                      <View className="flex-row items-center gap-1">
                        <Ionicons name="star" size={12} color="#F5A623" />
                        <Text className="text-xs font-bold text-sophia-text2">{teacher.rating}</Text>
                      </View>
                    </View>
                    <Text className="text-sophia-primary2 font-medium text-sm mb-2">{teacher.subject}</Text>
                    
                    <View className="flex-row items-center gap-3">
                      <View className="flex-row items-center gap-1">
                        <Ionicons name="time-outline" size={12} color="#5A6494" />
                        <Text className="text-[10px] text-sophia-text3">{teacher.experience}</Text>
                      </View>
                      <Text className="text-xs font-bold text-sophia-accent">{teacher.price} MT / aula</Text>
                    </View>
                  </View>
                </View>

                <View className="flex-row border-t border-sophia-border p-2 gap-2">
                  <Button 
                    label="Ver Perfil" 
                    variant="ghost" 
                    size="sm" 
                    className="flex-1"
                    textClassName="text-sophia-text2"
                  />
                  <Button 
                    label={teacher.status === 'online' ? "Solicitar Ajuda" : "Indisponivel"} 
                    size="sm" 
                    className="flex-1"
                    variant={teacher.status === 'online' ? 'default' : 'secondary'}
                    disabled={teacher.status === 'offline'}
                    onPress={() => handleRequestHelp(teacher)}
                  />
                </View>
              </CardContent>
            </Card>
          ))
        )}
      </View>
    </View>
  );

  const renderRequestsView = () => (
    <View className="pb-6 px-4">
        <View className="gap-4">
        {loading ? (
          <ActivityIndicator color="#5B6EF5" className="py-10" />
        ) : requests.length === 0 ? (
          <View className="bg-sophia-card p-10 rounded-3xl border border-sophia-border items-center">
              <Ionicons name="calendar-outline" size={40} color="#252A45" />
              <Text className="text-center text-sophia-text3 mt-4 italic">Nenhuma aula {userRole === 'TEACHER' ? 'recebida' : 'solicitada'} ainda.</Text>
          </View>
        ) : (
          requests.map((req) => (
            <Card key={req.id} className="bg-sophia-card border-sophia-border">
              <CardContent className="p-4">
                <View className="flex-row justify-between items-start mb-4">
                  <View className="flex-row gap-3">
                    <View className="h-10 w-10 rounded-xl bg-sophia-bg3 items-center justify-center">
                        <Ionicons name={userRole === 'TEACHER' ? "person-outline" : "videocam-outline"} size={20} color="#5B6EF5" />
                    </View>
                    <View>
                      <Text className="font-bold text-sophia-text text-sm">{req.subject}</Text>
                      <Text className="text-[10px] text-sophia-text3">
                        {userRole === 'TEACHER' ? `De: ${req.student.name}` : `Com: ${req.teacher.name}`}
                      </Text>
                    </View>
                  </View>
                  <View className="items-end">
                      <Text className={`text-[10px] font-bold ${getStatusColor(req.status)}`}>{req.status}</Text>
                      <Text className="text-[9px] text-sophia-text3 mt-1">{new Date(req.createdAt).toLocaleDateString()}</Text>
                  </View>
                </View>

                {req.description && (
                  <View className="bg-sophia-bg3 p-3 rounded-2xl mb-4 border-l-4 border-sophia-primary">
                    <Text className="text-[11px] text-sophia-text2 italic">"{req.description}"</Text>
                  </View>
                )}

                <View className="flex-row items-center justify-between pt-3 border-t border-sophia-border">
                    <Text className="text-xs font-bold text-sophia-text">{req.price} MT</Text>
                    
                    <View className="flex-row gap-2">
                      {/* Ações para o Professor */}
                      {userRole === 'TEACHER' && req.status === 'PENDING' && (
                        <>
                          <Button 
                            label="Recusar" 
                            variant="destructive" 
                            size="sm" 
                            className="px-3"
                            onPress={() => handleLessonAction(req.id, 'REJECTED')}
                          />
                          <Button 
                            label="Aceitar" 
                            size="sm" 
                            className="bg-sophia-accent px-3"
                            onPress={() => handleLessonAction(req.id, 'ACCEPTED')}
                          />
                        </>
                      )}
                      
                      {/* Ações comuns quando aceita */}
                      {req.status === 'ACCEPTED' && (
                        <Button 
                          label="Entrar na Sala" 
                          size="sm" 
                          className="bg-sophia-primary px-4"
                          onPress={() => {
                            const roomName = `SophIA-Aula-${req.id}`;
                            Linking.openURL(`https://meet.jit.si/${roomName}`);
                          }}
                        />
                      )}

                      {/* Botão de concluir para o professor quando a aula está em andamento */}
                      {userRole === 'TEACHER' && req.status === 'ACCEPTED' && (
                        <Button 
                          label="Finalizar" 
                          variant="outline"
                          size="sm" 
                          className="px-3 border-sophia-accent2"
                          textClassName="text-sophia-accent2"
                          onPress={() => handleLessonAction(req.id, 'COMPLETED')}
                        />
                      )}

                      {/* Ações para o Aluno */}
                      {userRole === 'STUDENT' && req.status === 'PENDING' && (
                        <Button 
                          label="Cancelar" 
                          variant="destructive" 
                          size="sm" 
                          className="px-4"
                          onPress={() => handleLessonAction(req.id, 'REJECTED')}
                        />
                      )}

                      {req.status === 'COMPLETED' && (
                          <View className="flex-row items-center gap-1">
                            <Ionicons name="checkmark-done" size={16} color="#5B6EF5" />
                            <Text className="text-[10px] text-sophia-primary2">Concluída</Text>
                          </View>
                      )}
                    </View>
                </View>
              </CardContent>
            </Card>
          ))
        )}
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-sophia-bg">
      {/* Tabs Customizadas */}
      <View className="flex-row p-4 gap-4">
        {userRole === 'STUDENT' && (
          <TouchableOpacity 
            onPress={() => setActiveTab('EXPLORE')}
            className={`flex-1 py-3 rounded-2xl border ${activeTab === 'EXPLORE' ? 'bg-sophia-primary/10 border-sophia-primary' : 'bg-sophia-card border-sophia-border'}`}
          >
            <Text className={`text-center font-bold text-xs ${activeTab === 'EXPLORE' ? 'text-sophia-primary2' : 'text-sophia-text2'}`}>Explorar</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          onPress={() => setActiveTab('REQUESTS')}
          className={`flex-1 py-3 rounded-2xl border ${activeTab === 'REQUESTS' ? 'bg-sophia-primary/10 border-sophia-primary' : 'bg-sophia-card border-sophia-border'}`}
        >
          <View className="flex-row items-center justify-center gap-2">
            <Text className={`text-center font-bold text-xs ${activeTab === 'REQUESTS' ? 'text-sophia-primary2' : 'text-sophia-text2'}`}>
              {userRole === 'TEACHER' ? 'Solicitações Recebidas' : 'Minhas Aulas'}
            </Text>
            {requests.filter(r => r.status === 'PENDING').length > 0 && (
              <View className="bg-sophia-danger h-4 w-4 rounded-full items-center justify-center">
                <Text className="text-white text-[8px] font-bold">{requests.filter(r => r.status === 'PENDING').length}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5B6EF5" />}
      >
        {activeTab === 'EXPLORE' && userRole === 'STUDENT' ? renderStudentView() : renderRequestsView()}
      </ScrollView>

      {/* Modal de Confirmação (Mantido igual) */}
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
              <Text className="text-2xl font-bold text-sophia-text">Confirmar Aula</Text>
            </View>

            {selectedTeacher && (
              <View className="mb-8">
                <View className="flex-row items-center gap-4 bg-sophia-card p-5 rounded-3xl border border-sophia-border mb-4">
                  <Image source={{ uri: selectedTeacher.image || `https://ui-avatars.com/api/?name=${selectedTeacher.name}&background=181B30&color=5B6EF5` }} className="h-14 w-14 rounded-2xl" />
                  <View className="flex-1">
                    <Text className="font-bold text-sophia-text text-lg">{selectedTeacher.name}</Text>
                    <Text className="text-xs text-sophia-text3">{selectedTeacher.subject}</Text>
                  </View>
                  <Text className="font-bold text-sophia-accent text-lg">{selectedTeacher.price} MT</Text>
                </View>

                <Input 
                  label="O que você quer aprender?"
                  placeholder="Ex: Ajuda com equações..."
                  value={requestDescription}
                  onChangeText={setRequestDescription}
                  multiline={true}
                  numberOfLines={4}
                  className="h-24 py-3"
                  containerClassName="mb-4"
                />

                <View className="bg-sophia-primary/10 p-5 rounded-3xl flex-row gap-4 border border-sophia-primary/20">
                  <Ionicons name="shield-checkmark" size={24} color="#5B6EF5" />
                  <Text className="flex-1 text-[11px] text-sophia-text2 leading-tight">
                    Segurança SophIA: O valor será retido e só será transferido ao professor após você confirmar a conclusão da aula.
                  </Text>
                </View>
              </View>
            )}

            <View className="flex-row gap-4 mb-6">
              <Button 
                label="Voltar" 
                variant="outline" 
                className="flex-1 border-sophia-border" 
                textClassName="text-sophia-text2"
                onPress={() => setIsModalVisible(false)} 
              />
              <Button 
                label="Confirmar Agora" 
                className="flex-1 bg-sophia-primary shadow-sophia-primary/40" 
                onPress={confirmRequest} 
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
