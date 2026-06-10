// "finding_id": {
//             type: 'uuid',
//             primaryKey: true,
//             default: pgm.func('gen_random_uuid()'),
//         },
//         'report_id': {
//             type: 'uuid',
//             notNull: true,
//         },
//         "category": {
//             type: 'text',
//             notNull: true,

//         },
//         "severity": {
//             type: 'text',
//             notNull: true,

//         },
//         "message": {
//             type: 'text',
//             notNull: true,
//         },
//         'created_at': {
//             default: pgm.func("now()"),
//             type: 'timestamp'
//         },
export default interface findings_interface {
    "category": string;
    "severity": string;
    "message": string;
    "filePath": string;
    "rule": string;
};