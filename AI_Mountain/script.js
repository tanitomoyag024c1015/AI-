import {
    db,
    collection,
    addDoc,
    getDocs,
    loginAnonymously
} from "./firebase.js";

import { API_KEY } from "./config.js";



// ===============================
// HTML要素を取得
// ===============================

const imageInput = document.getElementById("imageInput");
const previewImage = document.getElementById("previewImage");
const analyzeBtn = document.getElementById("analyzeBtn");
const result = document.getElementById("result");


// ===============================
// 変数
// ===============================

// 選択した画像
let selectedFile = null;

// 現在地
let currentLatitude = null;
let currentLongitude = null;

// Leafletの地図
let map = null;

// 地図上の投稿マーカー
let mapMarkers = [];

// 現在地マーカー
let currentLocationMarker = null;


// ===============================
// 画像が選択されたとき
// ===============================

imageInput.addEventListener("change", function (event) {

    selectedFile = event.target.files[0];

    // ファイルが選択されていない場合
    if (!selectedFile) {
        return;
    }

    // 画像を表示
    const reader = new FileReader();

    reader.onload = function (e) {

        previewImage.src = e.target.result;
        previewImage.style.display = "block";

    };

    reader.readAsDataURL(selectedFile);

});


// ===============================
// AI認識ボタン
// ===============================

analyzeBtn.addEventListener("click", async function () {

    // 画像未選択
    if (!selectedFile) {

        alert("画像を選択してください。");

        return;
    }

    result.innerText = "AIが解析中です...";


    // Base64へ変換
    const reader = new FileReader();

    reader.readAsDataURL(selectedFile);


    reader.onload = async function () {

        const base64Image =
            reader.result.split(",")[1];


        try {

            // ===============================
            // Gemini APIへ送信
            // ===============================

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "x-goog-api-key": API_KEY
                    },

                    body: JSON.stringify({

                        contents: [

                            {
                                parts: [

                                    {
                                        text:
`あなたは植物・動物の専門家であり、登山ガイドです。

画像をよく観察し、日本で見られる植物または動物をできるだけ正確に識別してください。

植物の場合は次の点を確認してください。
・花の色
・花の形
・葉の形
・葉の付き方
・茎や枝の特徴

動物の場合は次の点を確認してください。
・体の色
・模様
・耳やしっぽの特徴
・体の大きさ

もし一つに特定できない場合は、候補を3つまで挙げ、それぞれ理由も説明してください。

回答は次の形式でお願いします。

【名前】

【特徴】

【危険性】

【登山者へのアドバイス】

【AIの自信度】
0～100%

【他の候補】
`
                                    },

                                    {
                                        inlineData: {
                                            mimeType:
                                                selectedFile.type,
                                            data:
                                                base64Image
                                        }
                                    }

                                ]
                            }

                        ]

                    })
                }
            );


            // ===============================
            // APIレスポンス確認
            // ===============================

            console.log(
                "HTTP Status:",
                response.status
            );

            console.log(
                "Status Text:",
                response.statusText
            );


            const data =
                await response.json();

            console.log(data);


            // ===============================
            // APIエラー
            // ===============================

            if (!response.ok) {

                result.innerText =
                    "Gemini APIでエラーが発生しました。";

                return;
            }


            // ===============================
            // AIの回答を取得
            // ===============================

            const answer =
                data.candidates[0]
                    .content.parts[0].text;


            // ===============================
            // 結果表示
            // ===============================

            result.innerText = answer;


        } catch (error) {

            console.error(error);

            result.innerText =
                "AIとの通信中にエラーが発生しました。";

        }

    };

});


// ==================================================
// メッセージ投稿
// ==================================================

const sendMessageBtn =
    document.getElementById("sendMessageBtn");

const messageInput =
    document.getElementById("messageInput");

const messageStatus =
    document.getElementById("messageStatus");


sendMessageBtn.addEventListener(
    "click",
    async () => {

        const message =
            messageInput.value.trim();


        // メッセージ未入力
        if (message === "") {

            alert(
                "メッセージを入力してください。"
            );

            return;
        }


        // 現在地未取得
        if (
            currentLatitude === null ||
            currentLongitude === null
        ) {

            alert(
                "先に現在地を取得してください。"
            );

            return;
        }


        try {

            // ===============================
            // Firestoreへ保存
            // ===============================

            await addDoc(
                collection(db, "messages"),
                {
                    message: message,

                    latitude:
                        currentLatitude,

                    longitude:
                        currentLongitude,

                    createdAt:
                        new Date()
                }
            );


            // 投稿成功
            messageStatus.textContent =
                "投稿しました！";


            // 入力欄を空にする
            messageInput.value = "";

            
            // 通常の投稿一覧を更新
            loadMessages();
           

            // 近くの投稿一覧も更新
            loadNearbyMessages();


        } catch (error) {

            console.error(error);

            messageStatus.textContent =
                "投稿に失敗しました。";

        }

    }
);


// ==================================================
// メッセージ一覧表示
// ==================================================

const messageList =
    document.getElementById("messageList");


async function loadMessages() {

    messageList.innerHTML = "";


    try {

        const querySnapshot =
            await getDocs(
                collection(db, "messages")
            );


        // 投稿がない場合
        if (querySnapshot.empty) {

            messageList.innerHTML =
                "まだ投稿はありません。";

            return;
        }


        querySnapshot.forEach((doc) => {

            const data =
                doc.data();


            // カード
            const card =
                document.createElement("div");

            card.className =
                "messageCard";


            // メッセージ
            const message =
                document.createElement("p");

            message.textContent =
                data.message;


            // 投稿日時
            const time =
                document.createElement("p");

            time.className =
                "messageTime";


            if (data.createdAt) {

                const date =
                    data.createdAt.toDate();

                time.textContent =
                    date.toLocaleString(
                        "ja-JP"
                    );
            }


            card.appendChild(message);

            card.appendChild(time);

            messageList.appendChild(card);

        });


    } catch (error) {

        console.error(error);

    }

}




// ==================================================
// 現在地取得
// ==================================================

const locationBtn =
    document.getElementById("locationBtn");

const latitude =
    document.getElementById("latitude");

const longitude =
    document.getElementById("longitude");

const locationStatus =
    document.getElementById("locationStatus");


locationBtn.addEventListener(
    "click",
    () => {


        // ===============================
        // 位置情報に対応しているか確認
        // ===============================

        if (!navigator.geolocation) {

            locationStatus.textContent =
                "このブラウザは位置情報に対応していません。";

            return;
        }


        locationStatus.textContent =
            "現在地を取得中...";


        // ===============================
        // 現在地取得
        // ===============================

        navigator.geolocation.getCurrentPosition(

            // ===============================
            // 成功
            // ===============================

            (position) => {


                // 現在地を保存
                currentLatitude =
                    position.coords.latitude;

                currentLongitude =
                    position.coords.longitude;


                // 画面に表示
                latitude.textContent =
                    currentLatitude;

                longitude.textContent =
                    currentLongitude;


                locationStatus.textContent =
                    "取得成功！";


                // ===============================
                // 近くの投稿を取得
                // ===============================

                loadNearbyMessages();

            },


            // ===============================
            // 失敗
            // ===============================

            (error) => {

                console.error(error);

                locationStatus.textContent =
                    "位置情報を取得できませんでした。";

            }

        );

    }
);


// ==================================================
// 2地点間の距離を計算
// ==================================================

function calculateDistance(
    lat1,
    lon1,
    lat2,
    lon2
) {

    // 地球の半径（メートル）
    const R = 6371000;


    // 度 → ラジアン
    const toRadians = (degree) => {

        return degree *
            Math.PI /
            180;

    };


    const φ1 =
        toRadians(lat1);

    const φ2 =
        toRadians(lat2);

    const Δφ =
        toRadians(
            lat2 - lat1
        );

    const Δλ =
        toRadians(
            lon2 - lon1
        );


    const a =
        Math.sin(Δφ / 2) ** 2 +
        Math.cos(φ1) *
        Math.cos(φ2) *
        Math.sin(Δλ / 2) ** 2;


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return R * c;

}


// ==================================================
// 地図を初期化
// ==================================================

function initializeMap() {


    // すでに地図が存在する場合
    if (map !== null) {

        return;

    }


    // 地図を作成
    map =
        L.map("map")
            .setView(
                [
                    currentLatitude,
                    currentLongitude
                ],
                15
            );


    // OpenStreetMap
    L.tileLayer(
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        {

            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

        }
    ).addTo(map);

}


// ==================================================
// 地図を更新
// ==================================================

function updateMap() {


    // 現在地がない場合
    if (
        currentLatitude === null ||
        currentLongitude === null
    ) {

        return;

    }


    // 地図を初期化
    initializeMap();


    // 現在地を中心にする
    map.setView(
        [
            currentLatitude,
            currentLongitude
        ],
        15
    );


    // ===============================
    // 古い現在地マーカーを削除
    // ===============================

    if (
        currentLocationMarker !== null
    ) {

        map.removeLayer(
            currentLocationMarker
        );

    }


    // ===============================
    // 現在地マーカー
    // ===============================

    currentLocationMarker =
        L.marker(
            [
                currentLatitude,
                currentLongitude
            ]
        )
            .addTo(map)
            .bindPopup(
                "現在地"
            );


}


// ==================================================
// 近くの投稿を取得
// ==================================================

async function loadNearbyMessages() {


    const nearbyMessages =
        document.getElementById(
            "nearbyMessages"
        );


    const nearbyStatus =
        document.getElementById(
            "nearbyStatus"
        );


    // ===============================
    // 現在地チェック
    // ===============================

    if (
        currentLatitude === null ||
        currentLongitude === null
    ) {

        nearbyStatus.textContent =
            "先に現在地を取得してください。";

        return;

    }


    nearbyStatus.textContent =
        "近くの投稿を検索しています...";


    nearbyMessages.innerHTML = "";


    try {


        // ===============================
        // Firestoreから投稿取得
        // ===============================

        const querySnapshot =
            await getDocs(
                collection(db, "messages")
            );


        // 投稿を保存する配列
        const messages = [];


        querySnapshot.forEach(
            (doc) => {


                const data =
                    doc.data();


                // ===============================
                // 緯度・経度がない古い投稿
                // ===============================

                if (
                    data.latitude === undefined ||
                    data.longitude === undefined
                ) {

                    return;

                }


                // ===============================
                // 距離を計算
                // ===============================

                const distance =
                    calculateDistance(
                        currentLatitude,
                        currentLongitude,
                        data.latitude,
                        data.longitude
                    );


                // ===============================
                // 1km以内
                // ===============================

                if (
                    distance <= 1000
                ) {

                    messages.push({

                        id: doc.id,

                        ...data,

                        distance: distance

                    });

                }

            }
        );


        // ===============================
        // 距離の近い順に並べ替え
        // ===============================

        messages.sort(
            (a, b) => {

                return (
                    a.distance -
                    b.distance
                );

            }
        );


        // ===============================
        // 地図を更新
        // ===============================

        updateMap();


        // ===============================
        // 古い投稿マーカーを削除
        // ===============================

        mapMarkers.forEach(
            (marker) => {

                map.removeLayer(
                    marker
                );

            }
        );


        mapMarkers = [];


        // ===============================
        // 投稿を表示
        // ===============================

        messages.forEach(
            (data, index) => {


                // --------------------------------
                // 一覧表示
                // --------------------------------

                const messageElement =
                    document.createElement(
                        "div"
                    );


                messageElement.className =
                    "nearby-message";


                // innerHTMLではなく
                // textContentを使って安全に表示
                const title =
                    document.createElement(
                        "p"
                    );

                title.innerHTML =
                    `<strong>${index + 1}.  メッセージ</strong>`;


                const message =
                    document.createElement(
                        "p"
                    );

                message.textContent =
                    data.message;


                const distance =
                    document.createElement(
                        "p"
                    );

                distance.textContent =
                    `現在地から ${Math.round(data.distance)}m`;


                const line =
                    document.createElement(
                        "hr"
                    );


                messageElement.appendChild(
                    title
                );

                messageElement.appendChild(
                    message
                );

                messageElement.appendChild(
                    distance
                );

                messageElement.appendChild(
                    line
                );


                nearbyMessages.appendChild(
                    messageElement
                );


                // --------------------------------
                // 地図上に投稿マーカー
                // --------------------------------

                const popup =
                    document.createElement(
                        "div"
                    );


                const popupTitle =
                    document.createElement(
                        "strong"
                    );

                popupTitle.textContent =
                    "投稿";


                const popupMessage =
                    document.createElement(
                        "div"
                    );

                popupMessage.textContent =
                    data.message;


                const popupDistance =
                    document.createElement(
                        "div"
                    );

                popupDistance.textContent =
                    `現在地から ${Math.round(data.distance)}m`;


                popup.appendChild(
                    popupTitle
                );

                popup.appendChild(
                    document.createElement(
                        "br"
                    )
                );

                popup.appendChild(
                    popupMessage
                );

                popup.appendChild(
                    document.createElement(
                        "br"
                    )
                );

                popup.appendChild(
                    document.createElement(
                        "br"
                    )
                );

                popup.appendChild(
                    popupDistance
                );


                const marker =
                    L.marker(
                        [
                            data.latitude,
                            data.longitude
                        ]
                    )
                        .addTo(map)
                        .bindPopup(popup);


                mapMarkers.push(
                    marker
                );

            }
        );


        // ===============================
        // 結果表示
        // ===============================

        if (
            messages.length === 0
        ) {

            nearbyStatus.textContent =
                "現在地から1km以内に投稿はありません。";

        } else {

            nearbyStatus.textContent =
                `${messages.length}件の近くの投稿があります。`;

        }


    } catch (error) {

        console.error(error);

        nearbyStatus.textContent =
            "近くの投稿の取得に失敗しました。";

    }

}

// ===============================
// アプリ起動処理
// ===============================

async function initializeApp() {

    try {

        // Firebase匿名認証
        await loginAnonymously();

        console.log(
            "アプリの初期化が完了しました。"
        );

        // 認証完了後に投稿一覧を取得
        await loadMessages();

    } catch (error) {

        console.error(
            "アプリ初期化エラー:",
            error
        );

    }

}


// アプリを起動
initializeApp();