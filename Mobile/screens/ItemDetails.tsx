import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Image, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Rating } from 'react-native-ratings';
import { useRoute, RouteProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from "../App";
import { getItemDetails, addOrModifyItemRating } from '../api/events';
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

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const result = await getItemDetails(itemId);
            console.log(result)
            setItemData(result)
            if (result[2] && result[2] !== null) {
                setUserRating(result[2].rating_value || 0);
                setUserComment(result[2].comment || 0);
            }
        } catch (error) {
            console.error("Błąd ładowania danych:", error)
            setItemData([])
        } finally {
            setLoading(false);
        }
    }, [itemId]);

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
    const handleSave = async () => {
        if (userRating === 0) {
            Alert.alert('Błąd', 'Ocena nie może wynosić 0');
            return;
        }
        setEditable(false);
        await addOrModifyItemRating(itemId, userRating, userComment);
        load();
    };

    return (
        <SafeAreaView style={styles.containerSafe}>
            <ScrollView style={styles.container}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}>
                <Text style={styles.header}>{itemData[0].nazwa}</Text>

                {/* Display average rating if it exists */}
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

                <Image
                    style={styles.image}
                    source={{ uri: `data:image/png;base64,${itemData[0].image}` || 'https://via.placeholder.com/300' }}
                />
                <Text style={styles.label}>Attributes:</Text>
                {itemData[0].item_values.map((value: any, index: any) => (
                    <Text key={index} style={styles.attribute}>{value}</Text>
                ))}

                {/* Editable Rating and Comment Section */}
                <View style={styles.editableSection}>
                    <View style={styles.ratingRow}>
                        <Text style={styles.ratingText}>Twoja ocena:</Text>
                        <Rating
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
                    {editable ? (
                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                            <Text style={styles.buttonText}>Save</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                            <Text style={styles.buttonText}>Edit</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Comments Section */}
                {itemData[1].map((comment: any, index: any) => (
                    <View key={index} style={styles.commentContainer}>

                        {/* Display rating if it exists */}
                        {comment.rating_value !== undefined && comment.rating_value !== null && (
                            <View style={styles.ratingRow}>
                                <Text style={styles.username}>{comment.user}</Text>
                                <Rating
                                    ratingBackgroundColor="#f9f9f9"
                                    type="star"
                                    startingValue={comment.rating_value}
                                    readonly
                                    imageSize={24}
                                    style={styles.rating}
                                />
                                <Text style={styles.ratingTextRight}>{comment.rating_value.toFixed(1)}</Text>
                            </View>
                        )}

                        {/* Display comment if it exists */}
                        {comment.comment !== undefined && comment.comment !== null && (
                            <TextInput
                                style={styles.commentInput}
                                value={comment.comment}
                                editable={false}
                                multiline={true}
                            />
                        )}
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    containerSafe: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 10,
    },
    container: {
        flex: 1,
    },
    header: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    image: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        marginBottom: 10,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 10,
    },
    attribute: {
        fontSize: 14,
        marginVertical: 2,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
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
        borderRadius: 5,
        alignItems: 'center',
    },
    saveButton: {
        backgroundColor: '#4CAF50',
        padding: 10,
        marginTop: 10,
        borderRadius: 5,
        alignItems: 'center',
    },
    username: {
        marginLeft: 5,
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
