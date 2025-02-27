import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Image, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Rating } from 'react-native-ratings';
import { useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from "../App";
import { getItemDetails, addOrModifyItemRating, deleteComment } from '../api/events';
import { SafeAreaView } from 'react-native-safe-area-context';

type ItemDetailsScreenRouteProp = RouteProp<RootStackParamList, 'ItemDetails'>;

const ItemDetailScreen = () => {
    const route = useRoute<ItemDetailsScreenRouteProp>();
    const { itemId } = route.params;
    const [itemData, setItemData] = useState<any>([]);
    const [editable, setEditable] = useState(false);
    const [userRating, setUserRating] = useState<number>(0);
    const [userComment, setUserComment] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);  // Stan dla odświeżenia

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const result = await getItemDetails(itemId);
            setItemData(result)
            if (result[4] && result[4] !== null) {
                setUserRating(result[4].rating_value || 0);
                setUserComment(result[4].comment || 0);
            } else {
                setUserRating(0);
                setUserComment("");
            }
        } catch (error) {
            console.error("Błąd ładowania danych:", error)
            setItemData([])
        } finally {
            setLoading(false);
        }
    }, [itemId]);

    // Funkcja obsługująca odświeżenie
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        load().finally(() => setRefreshing(false));  // Ładuje dane ponownie po przeciągnięciu
    }, [load]);

    useFocusEffect(
        React.useCallback(() => {
            load();
        }, [load])
    );

    if (!itemData || itemData.length < 2 || loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text style={styles.loadingText}>Ładowanie...</Text>
            </View>
        );
    }

    const handleEdit = () => {
        setEditable(!editable);
    };
    const handleDelete = async () => {
        await deleteComment(itemId);
        await load();
    };
    const handleSave = async () => {
        if (userRating === 0) {
            Alert.alert('Błąd', 'Ocena nie może wynosić 0');
            return;
        }
        setEditable(false);
        await addOrModifyItemRating(itemId, userRating, userComment);
        await load();
    };

    return (
        <View style={styles.containerSafe}>
            <ScrollView
                style={styles.container}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />  // Dodanie RefreshControl
                }>
                <Text style={styles.header}>{itemData[0].name}</Text>
                {itemData[0].average_rating !== undefined && itemData[0].average_rating !== null && (
                    <View style={styles.ratingContainer}>
                        <View style={styles.ratingRowAverage}>
                            <Text style={styles.ratingTextAverage}>{itemData[0].average_rating.toFixed(1)}</Text>
                            <Rating
                                type="star"
                                startingValue={itemData[0].average_rating}
                                readonly
                                imageSize={24}
                                style={styles.ratingAverage}
                            />
                            <Text style={styles.ratingTextAverage}>({itemData[0].vote_count})</Text>
                        </View>
                    </View>
                )}

                {itemData[0].image && (
                    <Image
                        style={styles.image}
                        source={{ uri: `data:image/png;base64,${itemData[0].image}` }}
                    />
                )}
                <Text style={styles.label}>Atrybuty:</Text>
                {itemData[0].item_values.map((value: any, index: any) => (
                    <View key={index} style={styles.attributeRow}>
                        <Text style={styles.attribute}>{itemData[2][index]}:</Text>
                        <Text style={styles.attributeValue}> {value ? value : itemData[3][index]}</Text>
                    </View>
                ))}

                <View style={styles.editableSection}>
                    <View style={styles.ratingRow}>
                        <Text style={styles.ratingText}>Twoja ocena:</Text>
                        <Rating
                            tintColor="#f9f9f9"
                            ratingCount={5}
                            fractions={1}
                            jumpValue={0.1}
                            startingValue={userRating}
                            imageSize={24}
                            style={styles.rating}
                            readonly={!editable}
                            onSwipeRating={setUserRating}
                            onFinishRating={setUserRating}
                        />
                        <Text style={styles.ratingTextAverage}>({userRating})</Text>
                    </View>
                    <Text style={styles.label}>Komentarz:</Text>
                    <TextInput
                        style={styles.commentInput}
                        value={userComment}
                        onChangeText={setUserComment}
                        editable={editable}
                        multiline={true}
                    />
                    {["Active"].includes(itemData[5]) && (
                        <>
                            {editable ? (
                                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                                    <Text style={styles.buttonText}>Zapisz</Text>
                                </TouchableOpacity>
                            ) : (
                                <>
                                    <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                                        <Text style={styles.buttonTextFirst}>Edytuj komentarz</Text>
                                    </TouchableOpacity>
                                    {userRating !== 0 && (
                                        <TouchableOpacity style={styles.editButton} onPress={handleDelete}>
                                            <Text style={styles.buttonTextSecond}>Usuń komentarz</Text>
                                        </TouchableOpacity>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </View>

                {itemData[1].map((comment: any, index: any) => (
                    <View key={index} style={styles.commentContainer}>
                        {comment.rating_value !== undefined && comment.rating_value !== null ? (
                            <>
                                <View style={styles.ratingRow}>
                                    <Text style={styles.username}>{comment.user}</Text>
                                    <Rating
                                        tintColor="#f9f9f9"
                                        startingValue={comment.rating_value}
                                        readonly
                                        imageSize={24}
                                        style={styles.rating}
                                    />
                                    <Text style={styles.ratingTextRight}>{comment.rating_value.toFixed(1)}</Text>
                                </View>
                                {comment.comment !== undefined && comment.comment !== null && (
                                    <TextInput
                                        style={styles.commentInput}
                                        value={comment.comment}
                                        editable={false}
                                        multiline={true}
                                    />
                                )}
                            </>
                        ) : (
                            <>
                                {comment.comment !== undefined && comment.comment !== null && (
                                    <>
                                        <Text style={styles.username}>{comment.user}</Text>
                                        <TextInput
                                            style={styles.commentInput}
                                            value={comment.comment}
                                            editable={false}
                                            multiline={true}
                                        />
                                    </>
                                )}
                            </>
                        )
                        }
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    containerSafe: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 10,
        paddingTop: 0,
    },
    container: {
        flex: 1,
    },
    header: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        padding: 5,
    },
    image: {
        width: '100%',
        borderRadius: 10,
        marginBottom: 10,
        aspectRatio: 16 / 9,
        resizeMode: 'contain',
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 10,
    },
    attributeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 4,
    },
    attribute: {
        fontWeight: 'bold',
        marginRight: 4,
    },
    attributeValue: {
        color: '#333',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    buttonTextFirst: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    buttonTextSecond: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        color: "red",
    },
    rating: {
        alignSelf: 'flex-start',
        marginVertical: 5,
    },
    ratingAverage: {
        alignSelf: 'flex-start',
        marginVertical: 5,
    },
    ratingContainer: {
        alignItems: 'center',
        marginBottom: 10,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 10,
    },
    ratingRowAverage: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        marginRight: 5,
        fontSize: 20,
    },
    ratingTextRight: {
        marginLeft: 5,
        fontSize: 20,
    },
    ratingTextAverage: {
        marginLeft: 5,
        marginRight: 5,
        fontSize: 20,
    },
    commentContainer: {
        marginVertical: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        backgroundColor: '#f9f9f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    editableSection: {
        marginVertical: 20,
        padding: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        backgroundColor: '#f9f9f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    commentInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        borderRadius: 5,
        marginTop: 5,
        backgroundColor: '#fff',
    },
    editButton: {
        backgroundColor: '#f1f1f1',
        padding: 10,
        marginTop: 10,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    saveButton: {
        backgroundColor: '#4CAF50',
        padding: 10,
        marginTop: 10,
        borderRadius: 5,
        alignItems: 'center',
    },
    username: {
        fontWeight: 'bold',
        marginRight: 10,
        fontSize: 16,
    },
    loadingText: {
        fontSize: 16,
        color: '#0066cc',
        marginTop: 10,
    },
});


export default ItemDetailScreen;
