import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View
} from '@react-pdf/renderer';
import moment from '@/lib/moment-setup';
import { FREQUENCY_LABEL, KITCHEN_MODULES } from '../constants';
import {
  KitchenReportLayout,
  KitchenReportMeta,
  rangeLabel,
  ReportCell,
  ReportSection
} from './reportLayout';

const PAGE_PADDING = 28;
// A4 is 595 x 842 points
const tableWidth = (orientation: KitchenReportLayout['orientation']) =>
  (orientation === 'portrait' ? 595 : 842) - PAGE_PADDING * 2;

const INK = '#1f2937';
const MUTED = '#6b7280';
const HEAD_BG = '#f1f5f9';
const RULE = '#e2e8f0';
const BORDER = '#cbd5e1';
const FLAG = '#dc2626';

const styles = StyleSheet.create({
  page: {
    paddingTop: PAGE_PADDING,
    paddingHorizontal: PAGE_PADDING,
    paddingBottom: 42,
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: INK
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 10,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: RULE
  },
  company: { fontSize: 18, fontFamily: 'Helvetica-Bold', letterSpacing: 0.3 },
  title: {
    fontSize: 10,
    marginTop: 4,
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 1.2
  },
  infoBlock: { alignItems: 'flex-end' },
  infoRow: { flexDirection: 'row', marginTop: 2 },
  infoLabel: {
    fontSize: 7.5,
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginRight: 6
  },
  infoValue: { fontSize: 8.5, fontFamily: 'Helvetica-Bold' },
  section: { marginBottom: 12 },
  sectionTitle: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4
  },
  row: { flexDirection: 'row' },
  headCell: {
    backgroundColor: HEAD_BG,
    borderTopWidth: 0.75,
    borderRightWidth: 0.75,
    borderBottomWidth: 0.75,
    borderColor: BORDER,
    padding: 4,
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    justifyContent: 'center'
  },
  cell: {
    borderRightWidth: 0.75,
    borderBottomWidth: 0.75,
    borderColor: BORDER,
    padding: 4,
    justifyContent: 'center',
    minHeight: 20
  },
  firstCell: { borderLeftWidth: 0.75, borderLeftColor: BORDER },
  signature: { height: 24, objectFit: 'contain', marginBottom: 2 },
  flag: { color: FLAG, fontFamily: 'Helvetica-Bold' },
  notes: { marginTop: 4, fontSize: 8, color: INK },
  sheetCell: {
    borderRightWidth: 0.75,
    borderBottomWidth: 0.75,
    borderColor: INK,
    paddingVertical: 2,
    paddingHorizontal: 4,
    justifyContent: 'center',
    minHeight: 15
  },
  sheetFirstCell: { borderLeftWidth: 0.75, borderLeftColor: INK },
  sheetTop: { borderTopWidth: 0.75, borderTopColor: INK },
  strong: { fontFamily: 'Helvetica-Bold' },
  large: { fontSize: 11 },
  tall: { minHeight: 46, justifyContent: 'flex-start' },
  instructions: { marginTop: 2 },
  instructionsTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    textDecoration: 'underline',
    marginBottom: 4
  },
  instructionsHeading: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textDecoration: 'underline',
    marginBottom: 2
  },
  groupTitle: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    textDecoration: 'underline',
    marginTop: 4,
    marginBottom: 1
  },
  bullet: {
    flexDirection: 'row',
    marginLeft: 8,
    marginBottom: 1,
    fontSize: 8.5
  },
  bulletDot: { width: 9 },
  empty: { marginTop: 24, fontSize: 10, textAlign: 'center', color: MUTED },
  footer: {
    position: 'absolute',
    bottom: 16,
    left: PAGE_PADDING,
    right: PAGE_PADDING,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: RULE,
    fontSize: 7,
    color: MUTED
  }
});

const Cell = ({
  cell,
  width,
  first,
  sheet,
  top
}: {
  cell: ReportCell;
  width: number;
  first: boolean;
  sheet?: boolean;
  top?: boolean;
}) => (
  <View
    style={[
      sheet ? styles.sheetCell : styles.cell,
      first ? (sheet ? styles.sheetFirstCell : styles.firstCell) : {},
      sheet && top ? styles.sheetTop : {},
      cell.tall ? styles.tall : {},
      {
        width,
        alignItems:
          cell.align === 'center'
            ? 'center'
            : cell.align === 'right'
              ? 'flex-end'
              : 'flex-start'
      }
    ]}
  >
    {cell.image && <Image src={cell.image} style={styles.signature} />}
    {cell.label || cell.text ? (
      <Text
        style={[
          cell.strong ? styles.strong : {},
          cell.large ? styles.large : {},
          cell.flag ? styles.flag : {}
        ]}
      >
        {cell.label && <Text style={styles.strong}>{cell.label}</Text>}
        {cell.text}
      </Text>
    ) : null}
  </View>
);

const Table = ({
  section,
  width
}: {
  section: ReportSection;
  width: number;
}) => {
  const total = section.columns.reduce((sum, column) => sum + column.width, 0);
  const widths = section.columns.map(
    (column) => (column.width / total) * width
  );
  // A cell spanning several columns takes their widths together
  const cellWidth = (row: ReportCell[], index: number) => {
    const start = row
      .slice(0, index)
      .reduce((sum, cell) => sum + (cell.span || 1), 0);
    return widths
      .slice(start, start + (row[index].span || 1))
      .reduce((sum, value) => sum + value, 0);
  };

  return (
    <View style={styles.section} wrap={!section.sheet}>
      {section.title && (
        <Text style={styles.sectionTitle} minPresenceAhead={60}>
          {section.title}
        </Text>
      )}
      {/* Column heads repeat on every page the table runs onto */}
      {!section.sheet && (
        <View style={styles.row} fixed={!section.title}>
          {section.columns.map((column, index) => (
            <View
              key={`${column.label}-${index}`}
              style={[
                styles.headCell,
                index === 0 ? { borderLeftWidth: 0.75 } : {},
                { width: widths[index] }
              ]}
            >
              <Text>{column.label}</Text>
            </View>
          ))}
        </View>
      )}
      {section.rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row} wrap={false}>
          {row.map((cell, index) => (
            <Cell
              key={index}
              cell={cell}
              width={cellWidth(row, index)}
              first={index === 0}
              sheet={section.sheet}
              top={rowIndex === 0}
            />
          ))}
        </View>
      ))}
    </View>
  );
};

const Instructions = ({
  instructions
}: {
  instructions: NonNullable<KitchenReportLayout['instructions']>;
}) => (
  <View style={styles.instructions}>
    <Text style={styles.instructionsTitle}>{instructions.title}</Text>
    <Text style={styles.instructionsHeading}>{instructions.heading}</Text>
    {instructions.groups.map((group) => (
      <View key={group.title} wrap={false}>
        <Text style={styles.groupTitle}>{group.title}</Text>
        {group.intro ? (
          <Text style={{ fontSize: 8.5, marginBottom: 1 }}>{group.intro}</Text>
        ) : null}
        {group.items.map((item) => (
          <View key={item} style={styles.bullet}>
            <Text style={styles.bulletDot}>•</Text>
            <Text>{item}</Text>
          </View>
        ))}
      </View>
    ))}
    <Text style={{ fontSize: 8.5, marginTop: 4 }}>{instructions.footer}</Text>
  </View>
);

interface KitchenReportPDFProps {
  layout: KitchenReportLayout;
  meta: KitchenReportMeta;
}

export function KitchenReportPDF({ layout, meta }: KitchenReportPDFProps) {
  const config = KITCHEN_MODULES[meta.module];
  const generatedAt = moment().format('DD-MM-YYYY, HH:mm');
  const width = tableWidth(layout.orientation);

  const info = (label: string, value: string) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );

  return (
    <Document
      title={`${meta.companyName} - ${config.label}`}
      author={meta.companyName}
    >
      <Page size="A4" orientation={layout.orientation} style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.company}>{meta.companyName}</Text>
            <Text style={styles.title}>{layout.title}</Text>
          </View>
          <View style={styles.infoBlock}>
            {info('Frequency', FREQUENCY_LABEL[config.frequency])}
            {info('Period', rangeLabel(meta))}
            {meta.employeeName && info('Employee', meta.employeeName)}
          </View>
        </View>

        {layout.logCount === 0 ? (
          <Text style={styles.empty}>
            No {config.label.toLowerCase()} was completed in this period.
          </Text>
        ) : (
          layout.sections.map((section, index) => (
            <Table key={index} section={section} width={width} />
          ))
        )}

        {layout.logCount > 0 && layout.instructions && (
          <Instructions instructions={layout.instructions} />
        )}

        {layout.notes.map((note) => (
          <Text key={note} style={styles.notes} wrap={false}>
            {note}
          </Text>
        ))}

        <View style={styles.footer} fixed>
          <Text>
            {meta.companyName} · {config.label}
          </Text>
          <Text>Generated {generatedAt}</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
