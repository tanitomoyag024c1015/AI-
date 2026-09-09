// Firebase本体
import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";


// Firestore
import {
    getFirestore,
    collection,
    addDoc,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


// Authentication
import {
    getAuth,
    signInAnonymously
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";


// Firebase設定
const firebaseConfig = {

    apiKey: "AIzaSyAqzw_p8d1exJ9-FkZbdDwgJ3putcxYeoc",
    authDomain: "ai-mountain-guide-331b0.firebaseapp.com",
    projectId: "ai-mountain-guide-331b0",
    storageBucket: "ai-mountain-guide-331b0.firebasestorage.app",
    messagingSenderId: "82284623896",
    appId: "1:82284623896:web:c6011930407ca1bc976b6d"

};


// Firebaseを初期化
const app =
    initializeApp(firebaseConfig);


// Firestore
const db =
    getFirestore(app);


// Authentication
const auth =
    getAuth(app);


// 匿名認証を行う関数
async function loginAnonymously() {

    try {

        // すでにログイン済みなら何もしない
        if (auth.currentUser) {

            console.log(
                "すでに認証済みです。"
            );

            return auth.currentUser;

        }


        // 匿名ログイン
        const userCredential =
            await signInAnonymously(auth);


        console.log(
            "匿名認証成功:",
            userCredential.user.uid
        );


        return userCredential.user;


    } catch (error) {

        console.error(
            "匿名認証エラー:",
            error
        );

        throw error;

    }

}


// 他のファイルで使用できるようにexport
export {

    db,

    collection,

    addDoc,

    getDocs,

    auth,

    loginAnonymously

};