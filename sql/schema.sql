-- MsSQL схема для предметної області «Екосистема туризму»

CREATE TABLE Agencies (
    AgencyID INT IDENTITY PRIMARY KEY,
    Name NVARCHAR(150) NOT NULL,
    Email NVARCHAR(120) NOT NULL UNIQUE,
    Phone NVARCHAR(30),
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);

CREATE TABLE Users (
    UserID INT IDENTITY PRIMARY KEY,
    FullName NVARCHAR(150) NOT NULL,
    Email NVARCHAR(120) NOT NULL UNIQUE,
    Phone NVARCHAR(30),
    PreferredLanguage NVARCHAR(10),
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);

CREATE TABLE Tours (
    TourID INT IDENTITY PRIMARY KEY,
    AgencyID INT NOT NULL REFERENCES Agencies(AgencyID),
    Title NVARCHAR(200) NOT NULL,
    Country NVARCHAR(80),
    StartDate DATE,
    EndDate DATE,
    Price DECIMAL(10, 2) NOT NULL,
    MaxSeats INT NOT NULL CHECK (MaxSeats > 0),
    Description NVARCHAR(MAX),
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);

CREATE TABLE Bookings (
    BookingID INT IDENTITY PRIMARY KEY,
    UserID INT NOT NULL REFERENCES Users(UserID),
    TourID INT NOT NULL REFERENCES Tours(TourID),
    BookingDate DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    TravelersCount INT NOT NULL CHECK (TravelersCount > 0),
    Status NVARCHAR(30) NOT NULL DEFAULT 'Pending',
    Notes NVARCHAR(500)
);

CREATE TABLE Reviews (
    ReviewID INT IDENTITY PRIMARY KEY,
    UserID INT NOT NULL REFERENCES Users(UserID),
    TourID INT NOT NULL REFERENCES Tours(TourID),
    Rating TINYINT NOT NULL CHECK (Rating BETWEEN 1 AND 5),
    Comment NVARCHAR(1000),
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);

CREATE TABLE UserActivityLogs (
    LogID BIGINT IDENTITY PRIMARY KEY,
    UserID INT NOT NULL REFERENCES Users(UserID),
    TourID INT NULL REFERENCES Tours(TourID),
    ActionType NVARCHAR(50) NOT NULL,
    Metadata NVARCHAR(1000),
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);

CREATE TABLE Messages (
    MessageID BIGINT IDENTITY PRIMARY KEY,
    ConversationID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    UserID INT NOT NULL REFERENCES Users(UserID),
    AgencyID INT NOT NULL REFERENCES Agencies(AgencyID),
    SenderRole NVARCHAR(20) NOT NULL CHECK (SenderRole IN ('user', 'manager')),
    Body NVARCHAR(2000) NOT NULL,
    SentAt DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);

CREATE TABLE Notifications (
    NotificationID BIGINT IDENTITY PRIMARY KEY,
    UserID INT NOT NULL REFERENCES Users(UserID),
    Type NVARCHAR(50) NOT NULL,
    Payload NVARCHAR(1000),
    IsRead BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);

-- ---------------------------------------
-- Приклади вставок
-- ---------------------------------------

INSERT INTO Agencies (Name, Email, Phone) VALUES
(N'Globe Travel', 'contact@globetravel.com', '+380441234567'),
(N'Sun&Sea', 'info@sunsea.ua', '+380501234567');

INSERT INTO Users (FullName, Email, Phone, PreferredLanguage) VALUES
(N'Іван Петренко', 'ivan@example.com', '+380671112233', 'uk'),
(N'Олена Коваль', 'olena@example.com', '+380931112233', 'en');

INSERT INTO Tours (AgencyID, Title, Country, StartDate, EndDate, Price, MaxSeats, Description) VALUES
(1, N'Вікенд у Парижі', N'Франція', '2024-06-10', '2024-06-14', 850.00, 20, N'Екскурсії та гастротур.'),
(2, N'Йога-ретрит на Балі', N'Індонезія', '2024-09-01', '2024-09-10', 1450.00, 15, N'Детокс та пляжний відпочинок.');

INSERT INTO Bookings (UserID, TourID, TravelersCount, Status) VALUES
(1, 1, 2, 'Confirmed'),
(2, 2, 1, 'Pending');

INSERT INTO Reviews (UserID, TourID, Rating, Comment) VALUES
(1, 1, 5, N'Неймовірний тур!'),
(2, 2, 4, N'Все сподобалось, але переліт довгий.');

INSERT INTO UserActivityLogs (UserID, TourID, ActionType, Metadata) VALUES
(1, 1, 'view', N'{"source":"web","duration":35}'),
(1, NULL, 'search', N'{"query":"Італія","filters":["family"]}');

INSERT INTO Messages (ConversationID, UserID, AgencyID, SenderRole, Body) VALUES
(NEWID(), 1, 1, 'user', N'Доброго дня! Чи є знижки?'),
(NEWID(), 1, 1, 'manager', N'Вітаю! Є -10% на раннє бронювання.');

INSERT INTO Notifications (UserID, Type, Payload) VALUES
(1, 'booking_status', N'{"bookingId":1,"status":"Confirmed"}'),
(2, 'promotion', N'{"tourId":2,"discount":15}');

-- ---------------------------------------
-- Приклади SELECT-запитів
-- ---------------------------------------

-- 1. Бронювання конкретного користувача
DECLARE @UserId INT = 1;
SELECT b.BookingID, t.Title, b.Status, b.BookingDate
FROM Bookings b
JOIN Tours t ON t.TourID = b.TourID
WHERE b.UserID = @UserId
ORDER BY b.BookingDate DESC;

-- 2. Останні 50 повідомлень у чаті
DECLARE @ConversationId UNIQUEIDENTIFIER = '00000000-0000-0000-0000-000000000000';
SELECT TOP (50) MessageID, SenderRole, Body, SentAt
FROM Messages
WHERE ConversationID = @ConversationId
ORDER BY SentAt DESC;

-- 3. Всі логи активності користувача
SELECT LogID, ActionType, Metadata, CreatedAt
FROM UserActivityLogs
WHERE UserID = @UserId
ORDER BY CreatedAt DESC;
