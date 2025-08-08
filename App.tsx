import React, { useRef, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Alert,
  PanResponder,
  Modal,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import VersionLabel from "./components/versionLabel";
// import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt?: Date;
  completedAt?: Date | null;
}

const getStartOfDay = (date: Date): Date => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
};

const getEndOfDay = (date: Date): Date => {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
};

const randomGenerateDate = () => {
  const randomDate = new Date("2025-03-01T10:00:00.000Z");
  randomDate.setDate(randomDate.getDate() + Math.floor(Math.random() * 30));
  return randomDate;
};

const App = () => {
  const [todos, setTodos] = useState<Todo[]>([
    {
      id: "1",
      text: "Start developing this app",
      completed: true,
      createdAt: new Date(2025, 2, 1),
      completedAt: new Date(2025, 2, 28),
    },
    { id: "2", text: "Buy Suya", completed: false, createdAt: new Date(randomGenerateDate()) },
    { id: "3", text: "Goto market", completed: false, createdAt: new Date(randomGenerateDate()) },
  ]);
  const [newTodo, setNewTodo] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"todos" | "completed">("todos");
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [isResultsModalVisible, setIsResultsModalVisible] = useState(false);

  // Filter state
  const [filterStatus, setFilterStatus] = useState<"all" | "todos" | "completed">("all");

  // Results state
  const [searchResults, setSearchResults] = useState<Todo[]>([]);
  const [searchCriteria, setSearchCriteria] = useState<string>("");

  // Date filter state
  const todayStart = getStartOfDay(new Date()); // Get start of today
  const todayEnd = getEndOfDay(new Date());
  const [datePickerTarget, setDatePickerTarget] = useState<"start" | "end" | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(todayStart);
  const [endDate, setEndDate] = useState<Date | null>(todayEnd);

  const appPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const isHorizontalScroll = Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
        return isHorizontalScroll;
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { dx: verticalDisplacement } = gestureState;
        if (verticalDisplacement > 0) {
          setActiveTab("todos"); // Swipe right
        } else if (verticalDisplacement < 0) {
          setActiveTab("completed"); // Swipe left
        }
      },
    })
  ).current;

  const addTodo = () => {
    if (newTodo.trim() === "") {
      Alert.alert("Error", "Todo cannot be empty");
      return;
    }

    if (newTodo.trim() !== "") {
      const newTodoItem: Todo = {
        id: String(Date.now()),
        text: newTodo,
        completed: false,
        createdAt: new Date(randomGenerateDate()),
        completedAt: null,
      };
      setTodos([...todos, newTodoItem]);
      setNewTodo("");
      setActiveTab("todos");
    }
  };

  const toggleComplete = (id: string) => {
    setTodos(
      todos.map((todo) => {
        if (todo.id === id) {
          const newCompleted = !todo.completed;
          let newCompletedAt: Date | null = null;
          if (newCompleted) {
            if (todo.createdAt) {
              const completionDate = new Date(todo.createdAt);
              completionDate.setDate(completionDate.getDate() + 1);
              newCompletedAt = completionDate;
            } else {
              newCompletedAt = new Date();
              newCompletedAt.setDate(newCompletedAt.getDate() + 1);
            }
          }
          return {
            ...todo,
            completed: newCompleted,
            completedAt: newCompletedAt,
          };
        }
        return todo;
      })
    );
  };

  const deleteTodo = (id: string) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this todo?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setTodos(todos.filter((todo) => todo.id !== id));
          // setSearchResults((prevResults) => prevResults.filter((todo) => todo.id !== id));
        },
      },
    ]);
  };

  const showDatePickerMode = (target: "start" | "end") => {
    setDatePickerTarget(target);
    setShowDatePicker(true);

    if (target === "start") {
      setStartDate(randomGenerateDate());
    } else {
      setEndDate(randomGenerateDate());
    }
  };

  const formatDate = (date: Date | null): string => {
    return date ? date.toLocaleDateString() : "Select Date";
  };

  const renderItem = ({ item }: { item: Todo }) => {
    return (
      <View style={styles.todoItem}>
        <TouchableOpacity onPress={() => toggleComplete(item.id)}>
          <View style={styles.checkbox}>
            {item.completed ? (
              <Icon name="checkmark-done" size={13} color="green" />
            ) : (
              <View style={styles.checkboxPendingInner} />
            )}
          </View>
        </TouchableOpacity>
        <Text
          style={[styles.todoText, item.completed && styles.completedTodoText]}
          onPress={() => toggleComplete(item.id)}
        >
          {item.text}
        </Text>
        <TouchableOpacity style={styles.deleteButton} onPress={() => deleteTodo(item.id)}>
          <Icon name="trash" size={20} style={styles.deleteButtonText} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderResultItem = ({ item }: { item: Todo }) => (
    <View style={styles.resultItem}>
      <View style={[styles.statusIndicator, item.completed ? styles.indicatorCompleted : styles.indicatorPending]} />
      <View style={styles.todoTextContainer}>
        <Text style={[styles.todoText, item.completed && styles.completedTodoText]}>{item.text}</Text>
        <Text style={styles.dateText}>
          Added: {(item.createdAt as Date).toLocaleDateString()}
          {item.completed && item.completedAt ? ` | Done: ${item.completedAt.toLocaleDateString()}` : ""}
        </Text>
      </View>
    </View>
  );

  const handleSearch = () => {
    let results = [...todos];
    let criteriaDescription = "Filtered by: ";
    let filtersApplied = false;

    // 1. Filter by Status
    if (filterStatus === "todos") {
      results = results.filter((todo) => !todo.completed);
      criteriaDescription += "Status (Pending), ";
      filtersApplied = true;
    } else if (filterStatus === "completed") {
      results = results.filter((todo) => todo.completed);
      criteriaDescription += "Status (Completed), ";
      filtersApplied = true;
    } else {
      criteriaDescription += "Status (All), ";
    }

    // 1. Filter by Status
    if (filterStatus === "todos") {
      results = results.filter((todo) => !todo.completed);
      criteriaDescription += "Status (Pending), ";
      filtersApplied = true;
    } else if (filterStatus === "completed") {
      results = results.filter((todo) => todo.completed);
      criteriaDescription += "Status (Completed), ";
      filtersApplied = true;
    } else {
      criteriaDescription += "Status (All), ";
    }

    // 2. Filter by Start Date
    if (startDate) {
      if (!endDate) {
        Alert.alert("Error", "Please select an end date.");
        return;
      }
      if (startDate > endDate) {
        Alert.alert("Error", "End date cannot be before start date.");
        return;
      }
      const startOfDay = new Date(startDate);
      startOfDay.setHours(0, 0, 0, 0);
      results = results.filter((todo) => todo.createdAt && todo.createdAt >= startOfDay);
      criteriaDescription += `Start Date (${startDate.toLocaleDateString()}), `;
      filtersApplied = true;
    }

    // 3. Filter by End Date
    if (endDate) {
      if (!startDate) {
        Alert.alert("Error", "Please select a start date.");
        return;
      }
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      results = results.filter((todo) => todo.createdAt && todo.createdAt <= endOfDay);
      criteriaDescription += `End Date (${endDate.toLocaleDateString()}), `;
      filtersApplied = true;
    }

    if (!filtersApplied && filterStatus === "all" && !startDate && !endDate) {
      Alert.alert("No Filters", "Please select at least one filter criterion (status or date) to narrow down results.");
      return;
    }

    criteriaDescription = criteriaDescription.slice(0, -2);
    if (!filtersApplied && filterStatus === "all") {
      criteriaDescription = "Showing all todos";
    }

    // --- Update State and Modals ---
    setSearchResults(results);
    setSearchCriteria(criteriaDescription);
    setIsFilterModalVisible(false);
    setIsResultsModalVisible(true);
  };

  const filteredTodos =
    activeTab === "todos" ? todos.filter((todo) => !todo.completed) : todos.filter((todo) => todo.completed);

  return (
    <SafeAreaView style={styles.container}>
      <VersionLabel />
      <View style={styles.header}>
        <Text style={styles.title}>Ticket Slash</Text>
        <TouchableOpacity onPress={() => setIsFilterModalVisible(true)} style={styles.searchIcon}>
          <Icon name="filter-circle-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "todos" && styles.activeTab]}
          onPress={() => setActiveTab("todos")}
        >
          <Text style={[styles.tabText, activeTab === "todos" && styles.activeTabText]}>Todos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "completed" && styles.activeTab]}
          onPress={() => setActiveTab("completed")}
        >
          <Text style={[styles.tabText, activeTab === "completed" && styles.activeTabText]}>Completed</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.list} {...appPanResponder.panHandlers}>
        {filteredTodos.length === 0 && (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Icon name="alert-circle" size={50} style={{ color: "grey" }} />
            <Text style={{ color: "grey" }}> No results found</Text>
          </View>
        )}
        <FlatList data={filteredTodos} renderItem={renderItem} keyExtractor={(item) => item.id} />
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add new todo"
          value={newTodo}
          onChangeText={setNewTodo}
          onSubmitEditing={addTodo}
        />
        <TouchableOpacity style={styles.addButton} onPress={addTodo}>
          <Icon name="add" size={15} color="white" />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isFilterModalVisible}
        onRequestClose={() => {
          setIsFilterModalVisible(!isFilterModalVisible);
        }}
      >
        <View style={styles.filterModalOverlay}>
          <View style={styles.filterModalContainer}>
            <Text style={styles.filterModalTitle}>Filter Todos</Text>

            {/* Date Selection */}
            <View style={styles.dateFilterContainer}>
              <TouchableOpacity onPress={() => showDatePickerMode("start")} style={styles.dateButton}>
                <Icon name="calendar" size={10} color="grey" />
                <Text style={styles.dateButtonText}>Start: {formatDate(startDate)}</Text>
              </TouchableOpacity>
              <Icon name="arrow-forward" size={20} color="grey" />
              <TouchableOpacity onPress={() => showDatePickerMode("end")} style={styles.dateButton}>
                <Icon name="calendar" size={10} color="grey" />
                <Text style={styles.dateButtonText}>End: {formatDate(endDate)}</Text>
              </TouchableOpacity>
            </View>
            {(startDate || endDate) && (
              <TouchableOpacity
                onPress={() => {
                  setStartDate(null);
                  setEndDate(null);
                }}
                style={styles.clearDateButton}
              >
                <Text style={styles.clearDateButtonText}>Clear Dates</Text>
              </TouchableOpacity>
            )}

            {/* Status Toggle */}
            <Text style={styles.filterByStatusLabel}>Filter by Status:</Text>
            <View style={styles.statusToggleContainer}>
              <TouchableOpacity
                style={[styles.statusButton, filterStatus === "all" && styles.statusButtonActive]}
                onPress={() => setFilterStatus("all")}
              >
                <Text style={[styles.statusButtonText, filterStatus === "all" && styles.statusButtonTextActive]}>
                  All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusButton, filterStatus === "todos" && styles.statusButtonActive]}
                onPress={() => setFilterStatus("todos")}
              >
                <Text style={[styles.statusButtonText, filterStatus === "todos" && styles.statusButtonTextActive]}>
                  Todos
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusButton, filterStatus === "completed" && styles.statusButtonActive]}
                onPress={() => setFilterStatus("completed")}
              >
                <Text style={[styles.statusButtonText, filterStatus === "completed" && styles.statusButtonTextActive]}>
                  Completed
                </Text>
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.filterModalButtonContainer}>
              <TouchableOpacity
                style={[styles.filterModalButton, styles.buttonClose]}
                onPress={() => setIsFilterModalVisible(!isFilterModalVisible)}
              >
                <Icon name="ban-outline" size={20} color="white" />
                <Text style={styles.filterModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.filterModalButton, styles.buttonSearch]} onPress={handleSearch}>
                <Icon name="search" size={20} color="white" />
                <Text style={styles.filterModalButtonText}>Search</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Result Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isResultsModalVisible}
        onRequestClose={() => {
          setIsResultsModalVisible(false);
        }}
      >
        <SafeAreaView style={styles.resultsModalContainer}>
          <View style={styles.resultsModalHeader}>
            <TouchableOpacity onPress={() => setIsResultsModalVisible(false)} style={styles.backButton}>
              <Icon name="arrow-back" size={30} color="#333" />
            </TouchableOpacity>
            <Text style={styles.resultsModalTitle}>Search Results</Text>
          </View>

          <Text style={styles.resultsCriteriaDescription}>{searchCriteria}</Text>

          <FlatList
            data={searchResults}
            renderItem={renderResultItem}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={<Text style={styles.emptyListText}>No results found.</Text>}
            style={styles.resultsList}
          />

          <TouchableOpacity
            style={styles.resultsModalAdjustButton}
            onPress={() => {
              setIsResultsModalVisible(false);
              setIsFilterModalVisible(true);
            }}
          >
            <Icon name="options-outline" size={24} color="#fff" />
            <Text style={styles.resultsModalAdjustButtonText}>Adjust Filters ({searchResults.length})</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>

      {/* {showDatePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={(datePickerTarget === "start" ? startDate : endDate) ?? new Date()}
          mode="date"
          is24Hour={true}
          display="default"
          // onChange={onDateChange}
        />
      )} */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 7,
    marginTop: 30,
    backgroundColor: "#fff",
  },
  header: {
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  searchIcon: {
    position: "absolute",
    right: 0,
    padding: 5,
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    backgroundColor: "black",
    borderRadius: 30,
    padding: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    backgroundColor: "green",
    borderRadius: 30,
    color: "black",
  },
  tabText: {
    fontSize: 16,
    textAlign: "center",
    color: "white",
  },
  activeTabText: {
    fontWeight: "bold",
  },
  list: {
    flex: 1,
  },
  todoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  checkbox: {
    width: 14,
    height: 14,
    borderWidth: 1,
    borderColor: "black",
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxPendingInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "white",
  },
  todoText: {
    fontSize: 16,
    flex: 1,
  },
  completedTodoText: {
    textDecorationLine: "line-through",
    color: "gray",
  },
  deleteButton: {
    // backgroundColor: "red",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: "#636569", //#494b4f, 
    fontWeight: "bold",
  },
  inputContainer: {
    flexDirection: "row",
    marginTop: 3,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    marginRight: 8,
    borderRadius: 8,
    height: 40,
    overflow: "hidden",
  },
  addButton: {
    backgroundColor: "green",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 3,
  },
  addButtonText: {
    color: "white",
    fontWeight: "bold",
  },

  // --- Filter Modal Styles ---
  filterModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  filterModalContainer: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 35,
    alignItems: "center",
    width: "90%",
  },
  filterModalTitle: {
    marginBottom: 20,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
  },
  dateFilterContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    flexDirection: "row",
    gap: 5,
    backgroundColor: "#f0f0f0",
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
  },
  dateButtonText: {
    fontSize: 10,
    color: "#333",
  },
  clearDateButton: {
    marginBottom: 10,
    padding: 5,
    flexDirection: "row",
  },
  clearDateButtonText: {
    color: "blue",
    fontSize: 11,
    flex: 1,
    textAlign: "right",
  },
  filterByStatusLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  statusToggleContainer: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "green",
    borderRadius: 8,
    overflow: "hidden",
  },
  statusButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  statusButtonActive: {
    backgroundColor: "green",
  },
  statusButtonText: {
    color: "green",
    fontWeight: "500",
  },
  statusButtonTextActive: {
    color: "white",
  },
  filterModalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 15,
  },
  filterModalButton: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    elevation: 2,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 3,
    flex: 1,
    marginHorizontal: 5,
  },
  buttonClose: {
    backgroundColor: "grey",
  },
  buttonSearch: {
    backgroundColor: "green",
  },
  filterModalButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },

  // --- Styles for Results Modal ---
  emptyListText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: "grey",
  },
  resultsModalContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  resultsModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  backButton: {
    padding: 5,
  },
  resultsModalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "bold",
  },
  resultsCriteriaDescription: {
    fontSize: 14,
    color: "grey",
    paddingHorizontal: 15,
    paddingVertical: 10,
    textAlign: "center",
    fontStyle: "italic",
    backgroundColor: "#fff",
    marginBottom: 5,
  },
  resultsList: {
    flex: 1,
    paddingHorizontal: 15,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
    marginBottom: 5,
    borderRadius: 4,
    paddingHorizontal: 10,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  indicatorPending: {
    backgroundColor: "orange",
  },
  indicatorCompleted: {
    backgroundColor: "green",
  },
  todoTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  dateText: {
    fontSize: 12,
    color: "grey",
    marginTop: 4,
  },
  resultsModalAdjustButton: {
    backgroundColor: "green",
    paddingVertical: 15,
    margin: 15,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
    alignItems: "center",
  },
  resultsModalAdjustButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default App;
