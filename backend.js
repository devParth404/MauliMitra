// ============================================================
// MAULI MITRA - NETWORK BACKEND
// Laptop 1 = Backend + Dashboard
// Laptop 2 = ESP32 + Arduino IDE
//
// Backend IP: 10.79.73.6
// Port: 3000
//
// NO PREDEFINED ZONES
// LIVE DEVICE LOCATION ENABLED
// ESP32 NETWORK COMMUNICATION ENABLED
// ============================================================

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

const PORT = 3000;
const HOST = "0.0.0.0";

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(cors());

app.use(
    express.json({
        limit: "2mb"
    })
);

// Serve dashboard files from the same folder
app.use(express.static(__dirname));


// ============================================================
// DATA
// ============================================================

let requests = [];
let devices = {};


// ============================================================
// REQUEST ID
// ============================================================

function generateRequestId() {

    let id;

    do {

        id =
            "REQ-" +
            Math.floor(
                1000 +
                Math.random() * 9000
            );

    } while (
        requests.some(
            function(r) {
                return r.id === id;
            }
        )
    );

    return id;
}


// ============================================================
// DEVICE ID
// ============================================================

function generateDeviceId() {

    let id;

    do {

        id =
            "MM-" +
            String(
                Math.floor(
                    1 +
                    Math.random() * 999
                )
            ).padStart(3, "0");

    } while (
        devices[id]
    );

    return id;
}


// ============================================================
// NUMBER VALIDATION
// ============================================================

function validLatitude(value) {

    const n = Number(value);

    return (!Number.isNaN(n) &&
        n >= -90 &&
        n <= 90
    );
}


function validLongitude(value) {

    const n = Number(value);

    return (!Number.isNaN(n) &&
        n >= -180 &&
        n <= 180
    );
}


// ============================================================
// MARATHI / ENGLISH INTENT DETECTION
// ============================================================

function detectIntent(text) {

    const value =
        String(text || "")
        .toLowerCase()
        .normalize("NFC");


    // --------------------------------------------------------
    // MEDICAL
    // --------------------------------------------------------

    const medicalWords = [

        "medical",
        "medicine",
        "doctor",
        "hospital",
        "health",
        "ambulance",

        "डॉक्टर",
        "डॉक्टर पाहिजे",
        "डॉक्टर हवे",
        "वैद्यकीय",
        "मेडिकल",
        "औषध",
        "औषधे",
        "दवाखाना",
        "हॉस्पिटल",
        "रुग्णालय",
        "तब्येत",
        "तब्येत खराब",
        "जखम",
        "रक्त",
        "दुखत",
        "अॅम्ब्युलन्स",
        "एम्बुलन्स"

    ];


    if (
        medicalWords.some(
            function(word) {
                return value.includes(word);
            }
        )
    ) {

        return {

            intent: "Medical Help",

            priorityScore: 95,

            priorityLevel: "CRITICAL",

            confidence: 95

        };
    }


    // --------------------------------------------------------
    // EMERGENCY
    // --------------------------------------------------------

    const emergencyWords = [

        "emergency",
        "urgent",
        "save me",
        "help me",

        "इमर्जन्सी",
        "आपत्कालीन",
        "तातडीची मदत",
        "ताबडतोब मदत",
        "मदत करा",
        "वाचवा",
        "धोका",
        "जीवाला धोका"

    ];


    if (
        emergencyWords.some(
            function(word) {
                return value.includes(word);
            }
        )
    ) {

        return {

            intent: "Emergency",

            priorityScore: 90,

            priorityLevel: "CRITICAL",

            confidence: 95

        };
    }


    // --------------------------------------------------------
    // LOST PERSON
    // --------------------------------------------------------

    const lostWords = [

        "lost",
        "missing",
        "can't find",

        "हरवलो",
        "हरवले",
        "हरवली",
        "हरवला",
        "हरवले आहे",
        "वाट चुकलो",
        "वाट चुकले",
        "वाट चुकली",
        "माझी वाट चुकली",
        "गहाळ",
        "सापडत नाही"

    ];


    if (
        lostWords.some(
            function(word) {
                return value.includes(word);
            }
        )
    ) {

        return {

            intent: "Lost Person",

            priorityScore: 70,

            priorityLevel: "HIGH",

            confidence: 90

        };
    }


    // --------------------------------------------------------
    // FOOD
    // --------------------------------------------------------

    const foodWords = [

        "food",
        "hungry",
        "meal",

        "जेवण",
        "अन्न",
        "भूक",
        "भूक लागली",
        "खायला",
        "भोजन"

    ];


    if (
        foodWords.some(
            function(word) {
                return value.includes(word);
            }
        )
    ) {

        return {

            intent: "Food",

            priorityScore: 40,

            priorityLevel: "MEDIUM",

            confidence: 90

        };
    }


    // --------------------------------------------------------
    // WATER
    // --------------------------------------------------------

    const waterWords = [

        "water",
        "drinking water",

        "पाणी",
        "पाणी पाहिजे",
        "पाणी हवे",
        "पाणी द्या",
        "प्यायला पाणी",
        "पिण्याचे पाणी"

    ];


    if (
        waterWords.some(
            function(word) {
                return value.includes(word);
            }
        )
    ) {

        return {

            intent: "Water",

            priorityScore: 35,

            priorityLevel: "LOW",

            confidence: 95

        };
    }


    // --------------------------------------------------------
    // DEFAULT
    // --------------------------------------------------------

    return {

        intent: "Other Assistance",

        priorityScore: 50,

        priorityLevel: "MEDIUM",

        confidence: 50

    };
}


// ============================================================
// HOME
// ============================================================

app.get("/", function(req, res) {

    res.json({

        project: "Mauli Mitra",

        status: "Backend Running",

        server: "Node.js",

        host: HOST,

        port: PORT,

        backendIP: "10.79.73.6",

        zones: false,

        liveTracking: true,

        totalRequests: requests.length,

        totalDevices: Object.keys(devices).length

    });

});


// ============================================================
// HEALTH CHECK
// ============================================================

app.get(
    "/api/health",
    function(req, res) {

        res.json({

            success: true,

            status: "online",

            project: "Mauli Mitra",

            backendIP: "10.79.73.6",

            port: PORT,

            zonesEnabled: false,

            liveTrackingEnabled: true,

            time: new Date().toISOString(),

            totalRequests: requests.length,

            totalDevices: Object.keys(devices).length

        });

    }
);


// ============================================================
// DEVICE REGISTER
// ============================================================

app.post(
    "/api/devices/register",
    function(req, res) {

        try {

            let {

                deviceId,

                deviceName,

                deviceType,

                latitude,

                longitude,

                accuracy

            } = req.body;


            deviceId =
                deviceId ||
                generateDeviceId();


            if (
                latitude !== undefined &&
                !validLatitude(latitude)
            ) {

                return res.status(400).json({

                    success: false,

                    message: "Invalid latitude"

                });

            }


            if (
                longitude !== undefined &&
                !validLongitude(longitude)
            ) {

                return res.status(400).json({

                    success: false,

                    message: "Invalid longitude"

                });

            }


            devices[deviceId] = {

                deviceId: deviceId,

                deviceName: deviceName ||
                    "Connected Device",

                deviceType: deviceType ||
                    "ESP32 + Phone/Laptop",

                latitude: latitude !== undefined ?
                    Number(latitude) :
                    null,

                longitude: longitude !== undefined ?
                    Number(longitude) :
                    null,

                accuracy: accuracy !== undefined ?
                    Number(accuracy) :
                    null,

                online: true,

                lastSeen: new Date().toISOString(),

                registeredAt: new Date().toISOString()

            };


            console.log("");

            console.log(
                "=========================================="
            );

            console.log(
                "DEVICE REGISTERED"
            );

            console.log(
                "Device ID:",
                deviceId
            );

            console.log(
                "Device Name:",
                devices[deviceId].deviceName
            );

            console.log(
                "=========================================="
            );

            console.log("");


            res.json({

                success: true,

                message: "Device registered successfully",

                device: devices[deviceId]

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,

                message: error.message

            });

        }

    }
);


// ============================================================
// LIVE DEVICE LOCATION
// ============================================================

app.post(
    "/api/devices/location",
    function(req, res) {

        try {

            const {

                deviceId,

                deviceName,

                deviceType,

                latitude,

                longitude,

                accuracy

            } = req.body;


            if (!deviceId) {

                return res.status(400).json({

                    success: false,

                    message: "deviceId is required"

                });

            }


            if (!validLatitude(latitude)) {

                return res.status(400).json({

                    success: false,

                    message: "Valid latitude is required"

                });

            }


            if (!validLongitude(longitude)) {

                return res.status(400).json({

                    success: false,

                    message: "Valid longitude is required"

                });

            }


            const lat =
                Number(latitude);

            const lng =
                Number(longitude);

            const acc =
                accuracy !== undefined &&
                accuracy !== null ?
                Number(accuracy) :
                null;


            // ------------------------------------------------
            // CREATE DEVICE IF IT DOES NOT EXIST
            // ------------------------------------------------

            if (!devices[deviceId]) {

                devices[deviceId] = {

                    deviceId: deviceId,

                    deviceName: deviceName ||
                        "Connected Device",

                    deviceType: deviceType ||
                        "Phone/Laptop",

                    latitude: null,

                    longitude: null,

                    accuracy: null,

                    online: true,

                    registeredAt: new Date().toISOString()

                };

            }


            // ------------------------------------------------
            // UPDATE DEVICE
            // ------------------------------------------------

            devices[deviceId].latitude =
                lat;

            devices[deviceId].longitude =
                lng;

            devices[deviceId].accuracy =
                acc;

            devices[deviceId].online =
                true;

            devices[deviceId].lastSeen =
                new Date().toISOString();


            if (deviceName) {

                devices[deviceId].deviceName =
                    deviceName;

            }


            if (deviceType) {

                devices[deviceId].deviceType =
                    deviceType;

            }


            // ------------------------------------------------
            // UPDATE ACTIVE REQUEST LOCATION
            // ------------------------------------------------

            requests.forEach(
                function(request) {

                    if (

                        request.deviceId ===
                        deviceId

                        &&

                        (
                            request.status ===
                            "Pending"

                            ||

                            request.status ===
                            "Accepted"
                        )

                    ) {

                        request.latitude =
                            lat;

                        request.longitude =
                            lng;

                        request.accuracy =
                            acc;

                        request.locationSource =
                            "Live Connected Device";

                        request.updatedAt =
                            new Date().toISOString();

                    }

                }
            );


            console.log(
                "LIVE LOCATION:",
                deviceId,
                "=>",
                lat,
                lng,
                acc !== null ?
                "±" + acc + "m" :
                ""
            );


            res.json({

                success: true,

                message: "Live location updated",

                device: devices[deviceId]

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,

                message: error.message

            });

        }

    }
);


// ============================================================
// GET ALL DEVICES
// ============================================================

app.get(
    "/api/devices",
    function(req, res) {

        const now =
            Date.now();


        const deviceList =
            Object.values(devices)
            .map(
                function(device) {

                    const lastSeen =
                        new Date(
                            device.lastSeen
                        ).getTime();


                    const seconds =
                        (
                            now -
                            lastSeen
                        ) / 1000;


                    return {

                        ...device,

                        online: seconds <= 15

                    };

                }
            );


        res.json({

            success: true,

            devices: deviceList

        });

    }
);


// ============================================================
// GET SINGLE DEVICE
// ============================================================

app.get(
    "/api/devices/:deviceId",
    function(req, res) {

        const device =
            devices[
                req.params.deviceId
            ];


        if (!device) {

            return res.status(404).json({

                success: false,

                message: "Device not found"

            });

        }


        res.json({

            success: true,

            device: device

        });

    }
);


// ============================================================
// CREATE REQUEST
// ============================================================

app.post(
    "/api/requests",
    function(req, res) {

        try {

            const {

                deviceId,

                deviceName,

                deviceType,

                latitude,

                longitude,

                accuracy,

                type,

                transcript,

                intent

            } = req.body;


            const finalDeviceId =
                deviceId ||
                generateDeviceId();


            const device =
                devices[finalDeviceId];


            // ------------------------------------------------
            // GET LATEST DEVICE LOCATION
            // ------------------------------------------------

            let finalLatitude = null;
            let finalLongitude = null;
            let finalAccuracy = null;


            if (
                latitude !== undefined &&
                validLatitude(latitude)
            ) {

                finalLatitude =
                    Number(latitude);

            } else if (
                device &&
                device.latitude !== null
            ) {

                finalLatitude =
                    device.latitude;

            }


            if (
                longitude !== undefined &&
                validLongitude(longitude)
            ) {

                finalLongitude =
                    Number(longitude);

            } else if (
                device &&
                device.longitude !== null
            ) {

                finalLongitude =
                    device.longitude;

            }


            if (
                accuracy !== undefined &&
                accuracy !== null
            ) {

                finalAccuracy =
                    Number(accuracy);

            } else if (
                device
            ) {

                finalAccuracy =
                    device.accuracy;

            }


            // ------------------------------------------------
            // INTENT
            // ------------------------------------------------

            const detected =
                detectIntent(
                    transcript ||
                    intent ||
                    ""
                );


            const finalIntent =
                transcript ||
                intent ?
                detected.intent :
                "Waiting for voice intent";


            const request = {

                id: generateRequestId(),

                deviceId: finalDeviceId,

                deviceName: deviceName ||
                    (
                        device ?
                        device.deviceName :
                        "Connected Device"
                    ),

                deviceType: deviceType ||
                    (
                        device ?
                        device.deviceType :
                        "ESP32"
                    ),

                latitude: finalLatitude,

                longitude: finalLongitude,

                accuracy: finalAccuracy,

                type: type ||
                    "Emergency",

                intent: finalIntent,

                transcript: transcript ||
                    "",

                intentConfidence: transcript ||
                    intent ?
                    detected.confidence :
                    0,

                priorityScore: transcript ||
                    intent ?
                    detected.priorityScore :
                    0,

                priority: transcript ||
                    intent ?
                    detected.priorityLevel :
                    "WAITING",

                status: "Pending",

                acceptedBy: null,

                acceptedAt: null,

                rejectedAt: null,

                completedAt: null,

                source: "ESP32",

                locationSource: finalLatitude !== null &&
                    finalLongitude !== null

                    ?
                    "Live Connected Device"

                    : "Waiting for location",

                intentSource: transcript ||
                    intent

                    ?
                    "External Microphone"

                    : "Waiting",

                createdAt: new Date().toISOString(),

                updatedAt: new Date().toISOString(),

                time: new Date().toLocaleTimeString(
                    "en-IN"
                )

            };


            requests.unshift(
                request
            );


            // ------------------------------------------------
            // REGISTER DEVICE AUTOMATICALLY
            // ------------------------------------------------

            if (!devices[finalDeviceId]) {

                devices[finalDeviceId] = {

                    deviceId: finalDeviceId,

                    deviceName: request.deviceName,

                    deviceType: request.deviceType,

                    latitude: finalLatitude,

                    longitude: finalLongitude,

                    accuracy: finalAccuracy,

                    online: true,

                    lastSeen: new Date().toISOString(),

                    registeredAt: new Date().toISOString()

                };

            }


            console.log("");

            console.log(
                "=========================================="
            );

            console.log(
                "🚨 NEW MAULI MITRA REQUEST"
            );

            console.log(
                "=========================================="
            );

            console.log(
                "Request ID:",
                request.id
            );

            console.log(
                "Device ID:",
                request.deviceId
            );

            console.log(
                "Location:",
                request.latitude,
                request.longitude
            );

            console.log(
                "Accuracy:",
                request.accuracy
            );

            console.log(
                "Intent:",
                request.intent
            );

            console.log(
                "Priority:",
                request.priorityScore + "%"
            );

            console.log(
                "Status:",
                request.status
            );

            console.log(
                "=========================================="
            );

            console.log("");


            res.status(201).json({

                success: true,

                message: "Emergency request created",

                request: request

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,

                message: error.message

            });

        }

    }
);


// ============================================================
// ESP32 SIMPLE BUTTON ENDPOINT
//
// Your ESP32 can call this directly.
// ============================================================

app.post(
    "/api/esp32/button",
    function(req, res) {

        try {

            const {

                deviceId,

                deviceName,

                deviceType,

                latitude,

                longitude,

                accuracy

            } = req.body;


            const finalDeviceId =
                deviceId ||
                generateDeviceId();


            const device =
                devices[finalDeviceId];


            let finalLatitude =
                null;

            let finalLongitude =
                null;

            let finalAccuracy =
                null;


            if (
                latitude !== undefined &&
                validLatitude(latitude)
            ) {

                finalLatitude =
                    Number(latitude);

            } else if (
                device &&
                device.latitude !== null
            ) {

                finalLatitude =
                    device.latitude;

            }


            if (
                longitude !== undefined &&
                validLongitude(longitude)
            ) {

                finalLongitude =
                    Number(longitude);

            } else if (
                device &&
                device.longitude !== null
            ) {

                finalLongitude =
                    device.longitude;

            }


            if (
                accuracy !== undefined &&
                accuracy !== null
            ) {

                finalAccuracy =
                    Number(accuracy);

            } else if (
                device
            ) {

                finalAccuracy =
                    device.accuracy;

            }


            const request = {

                id: generateRequestId(),

                deviceId: finalDeviceId,

                deviceName: deviceName ||
                    (
                        device ?
                        device.deviceName :
                        "ESP32 Device"
                    ),

                deviceType: deviceType ||
                    "ESP32",

                latitude: finalLatitude,

                longitude: finalLongitude,

                accuracy: finalAccuracy,

                type: "Emergency",

                intent: "Waiting for voice intent",

                transcript: "",

                intentConfidence: 0,

                priorityScore: 0,

                priority: "WAITING",

                status: "Pending",

                acceptedBy: null,

                acceptedAt: null,

                rejectedAt: null,

                completedAt: null,

                source: "ESP32 Button",

                locationSource: finalLatitude !== null &&
                    finalLongitude !== null

                    ?
                    "Live Connected Device"

                    : "Waiting for location",

                intentSource: "Waiting for External Microphone",

                createdAt: new Date().toISOString(),

                updatedAt: new Date().toISOString(),

                time: new Date().toLocaleTimeString(
                    "en-IN"
                )

            };


            requests.unshift(
                request
            );


            // ------------------------------------------------
            // CREATE / UPDATE DEVICE
            // ------------------------------------------------

            if (!devices[finalDeviceId]) {

                devices[finalDeviceId] = {

                    deviceId: finalDeviceId,

                    deviceName: request.deviceName,

                    deviceType: request.deviceType,

                    latitude: finalLatitude,

                    longitude: finalLongitude,

                    accuracy: finalAccuracy,

                    online: true,

                    lastSeen: new Date().toISOString(),

                    registeredAt: new Date().toISOString()

                };

            }


            console.log("");

            console.log(
                "=========================================="
            );

            console.log(
                "🔴 ESP32 BUTTON PRESSED"
            );

            console.log(
                "=========================================="
            );

            console.log(
                "Request:",
                request.id
            );

            console.log(
                "Device:",
                request.deviceId
            );

            console.log(
                "Status:",
                "Pending"
            );

            console.log(
                "=========================================="
            );

            console.log("");


            res.status(201).json({

                success: true,

                message: "ESP32 emergency request received",

                request: request

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,

                message: error.message

            });

        }

    }
);


// ============================================================
// GET ALL REQUESTS
// ============================================================

app.get(
    "/api/requests",
    function(req, res) {

        res.json(
            requests
        );

    }
);


// ============================================================
// GET REQUEST
// ============================================================

app.get(
    "/api/requests/:id",
    function(req, res) {

        const request =
            requests.find(
                function(item) {

                    return (
                        item.id ===
                        req.params.id
                    );

                }
            );


        if (!request) {

            return res.status(404).json({

                success: false,

                message: "Request not found"

            });

        }


        res.json({

            success: true,

            request: request

        });

    }
);


// ============================================================
// UPDATE REQUEST LOCATION
// ============================================================

app.patch(
    "/api/requests/:id/location",
    function(req, res) {

        const request =
            requests.find(
                function(item) {

                    return (
                        item.id ===
                        req.params.id
                    );

                }
            );


        if (!request) {

            return res.status(404).json({

                success: false,

                message: "Request not found"

            });

        }


        const {

            latitude,

            longitude,

            accuracy

        } = req.body;


        if (!validLatitude(latitude) ||
            !validLongitude(longitude)
        ) {

            return res.status(400).json({

                success: false,

                message: "Invalid coordinates"

            });

        }


        request.latitude =
            Number(latitude);

        request.longitude =
            Number(longitude);

        request.accuracy =
            accuracy !== undefined ?
            Number(accuracy) :
            null;

        request.locationSource =
            "Live Connected Device";

        request.updatedAt =
            new Date().toISOString();


        res.json({

            success: true,

            message: "Request location updated",

            request: request

        });

    }
);


// ============================================================
// UPDATE INTENT
// ============================================================

app.patch(
    "/api/requests/:id/intent",
    function(req, res) {

        const request =
            requests.find(
                function(item) {

                    return (
                        item.id ===
                        req.params.id
                    );

                }
            );


        if (!request) {

            return res.status(404).json({

                success: false,

                message: "Request not found"

            });

        }


        const {

            intent,

            transcript,

            intentConfidence

        } = req.body;


        const detected =
            detectIntent(
                transcript ||
                intent ||
                ""
            );


        request.intent =
            detected.intent;


        request.transcript =
            transcript ||
            request.transcript;


        request.intentConfidence =
            intentConfidence !== undefined ?
            Number(
                intentConfidence
            ) :
            detected.confidence;


        request.priorityScore =
            detected.priorityScore;


        request.priority =
            detected.priorityLevel;


        request.intentSource =
            "External Microphone";


        request.updatedAt =
            new Date().toISOString();


        res.json({

            success: true,

            message: "Intent updated",

            request: request

        });

    }
);


// ============================================================
// ACCEPT / REJECT / COMPLETE
// ============================================================

app.post(
    "/api/requests/:id/status",
    function(req, res) {

        const request =
            requests.find(
                function(item) {

                    return (
                        item.id ===
                        req.params.id
                    );

                }
            );


        if (!request) {

            return res.status(404).json({

                success: false,

                message: "Request not found"

            });

        }


        const {

            status,

            acceptedBy

        } = req.body;


        const allowedStatuses = [

            "Pending",

            "Accepted",

            "Rejected",

            "Completed"

        ];


        if (!allowedStatuses.includes(
                status
            )) {

            return res.status(400).json({

                success: false,

                message: "Invalid status"

            });

        }


        // ------------------------------------------------
        // ACCEPT
        // ------------------------------------------------

        if (
            status ===
            "Accepted"
        ) {

            request.status =
                "Accepted";


            request.acceptedBy =
                acceptedBy ||
                "Volunteer";


            request.acceptedAt =
                new Date().toISOString();

        }


        // ------------------------------------------------
        // REJECT
        // ------------------------------------------------
        else if (
            status ===
            "Rejected"
        ) {

            request.status =
                "Rejected";


            request.rejectedAt =
                new Date().toISOString();

        }


        // ------------------------------------------------
        // COMPLETE
        // ------------------------------------------------
        else if (
            status ===
            "Completed"
        ) {

            request.status =
                "Completed";


            request.completedAt =
                new Date().toISOString();

        }


        // ------------------------------------------------
        // PENDING
        // ------------------------------------------------
        else {

            request.status =
                "Pending";

        }


        request.updatedAt =
            new Date().toISOString();


        console.log(
            "REQUEST UPDATED:",
            request.id,
            "=>",
            request.status
        );


        res.json({

            success: true,

            message: "Request status updated",

            request: request

        });

    }
);


// ============================================================
// STATISTICS
// ============================================================

app.get(
    "/api/stats",
    function(req, res) {

        const pending =
            requests.filter(
                function(r) {

                    return (
                        r.status ===
                        "Pending"
                    );

                }
            ).length;


        const accepted =
            requests.filter(
                function(r) {

                    return (
                        r.status ===
                        "Accepted"
                    );

                }
            ).length;


        const completed =
            requests.filter(
                function(r) {

                    return (
                        r.status ===
                        "Completed"
                    );

                }
            ).length;


        const rejected =
            requests.filter(
                function(r) {

                    return (
                        r.status ===
                        "Rejected"
                    );

                }
            ).length;


        const liveDevices =
            Object.values(
                devices
            ).filter(
                function(device) {

                    const lastSeen =
                        new Date(
                            device.lastSeen
                        ).getTime();


                    return (
                        Date.now() -
                        lastSeen
                    ) <= 15000;

                }
            ).length;


        res.json({

            success: true,

            total: requests.length,

            pending: pending,

            accepted: accepted,

            completed: completed,

            rejected: rejected,

            liveDevices: liveDevices,

            totalDevices: Object.keys(
                devices
            ).length

        });

    }
);


// ============================================================
// CLEAR REQUESTS
// ============================================================

app.delete(
    "/api/requests",
    function(req, res) {

        const deleted =
            requests.length;


        requests = [];


        res.json({

            success: true,

            message: "All requests cleared",

            deleted: deleted

        });

    }
);


// ============================================================
// 404 HANDLER
// ============================================================

app.use(
    function(req, res) {

        res.status(404).json({

            success: false,

            message: "API endpoint not found",

            path: req.originalUrl

        });

    }
);


// ============================================================
// SERVER
// ============================================================

app.listen(
    PORT,
    HOST,
    function() {

        console.log("");

        console.log(
            "================================================"
        );

        console.log(
            "          🌺 MAULI MITRA BACKEND"
        );

        console.log(
            "================================================"
        );

        console.log("");

        console.log(
            "SERVER STATUS : ONLINE"
        );

        console.log(
            "HOST          : 0.0.0.0"
        );

        console.log(
            "PORT          : 3000"
        );

        console.log(
            "NETWORK IP    : 10.79.73.6"
        );

        console.log("");

        console.log(
            "Dashboard:"
        );

        console.log(
            "http://10.79.73.6:3000/dashboard.html"
        );

        console.log("");

        console.log(
            "Health:"
        );

        console.log(
            "http://10.79.73.6:3000/api/health"
        );

        console.log("");

        console.log(
            "ESP32 Button:"
        );

        console.log(
            "POST /api/esp32/button"
        );

        console.log("");

        console.log(
            "Live Location:"
        );

        console.log(
            "POST /api/devices/location"
        );

        console.log("");

        console.log(
            "Predefined Zones : DISABLED"
        );

        console.log(
            "Live Tracking    : ENABLED"
        );

        console.log(
            "Two-Laptop Mode  : ENABLED"
        );

        console.log("");

        console.log(
            "Waiting for ESP32..."
        );

        console.log("");

        console.log(
            "================================================"
        );

    }
);