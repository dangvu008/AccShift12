/**
 * @typedef {Object} RouteParams
 * @property {string} [shiftId] - ID của ca làm việc (nếu có)
 */

/**
 * @typedef {Object} Route
 * @property {string} name - Tên của route
 * @property {RouteParams} [params] - Tham số của route
 */

/**
 * @typedef {Object} NotificationData
 * @property {boolean} [isAlarm] - Có phải là thông báo báo thức không
 */

/**
 * @typedef {Object} NotificationContent
 * @property {NotificationData} data - Dữ liệu của thông báo
 */

/**
 * @typedef {Object} NotificationRequest
 * @property {NotificationContent} content - Nội dung của thông báo
 */

/**
 * @typedef {Object} Notification
 * @property {NotificationRequest} request - Yêu cầu thông báo
 */

/**
 * @typedef {Object} NotificationResponse
 * @property {{request: {content: {data: NotificationData}}}} notification - Thông báo
 */

/**
 * @typedef {Object} TabBarIconProps
 * @property {boolean} focused - Tab có được focus không
 * @property {string} color - Màu của icon
 * @property {number} size - Kích thước của icon
 */

/**
 * @typedef {Object} AppContentProps
 * @property {Notification} notification - Thông báo
 */
