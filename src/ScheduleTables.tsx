import { Button, ButtonGroup, Flex, Heading, Stack } from '@chakra-ui/react';
import ScheduleTable from './ScheduleTable.tsx';
import { useScheduleContext } from './ScheduleContext.tsx';
import SearchDialog from './SearchDialog.tsx';
import { useState, useCallback, memo } from 'react';

// 개별 테이블 컴포넌트를 메모이제이션
const MemoizedScheduleTable = memo(ScheduleTable);

export const ScheduleTables = () => {
  const { schedulesMap, setSchedulesMap } = useScheduleContext();
  const [searchInfo, setSearchInfo] = useState<{
    tableId: string;
    day?: string;
    time?: number;
  } | null>(null);

  const disabledRemoveButton = Object.keys(schedulesMap).length === 1;

  const duplicate = useCallback(
    (targetId: string) => {
      setSchedulesMap((prev) => ({
        ...prev,
        [`schedule-${Date.now()}`]: [...prev[targetId]],
      }));
    },
    [setSchedulesMap]
  );

  const remove = useCallback(
    (targetId: string) => {
      setSchedulesMap((prev) => {
        const newMap = { ...prev };
        delete newMap[targetId];
        return newMap;
      });
    },
    [setSchedulesMap]
  );

  // 스케줄 삭제 핸들러 메모이제이션
  const handleDeleteSchedule = useCallback(
    (tableId: string, day: string, time: number) => {
      setSchedulesMap((prev) => ({
        ...prev,
        [tableId]: prev[tableId].filter(
          (schedule) => schedule.day !== day || !schedule.range.includes(time)
        ),
      }));
    },
    [setSchedulesMap]
  );

  // 검색 정보 설정 핸들러 메모이제이션
  const handleSetSearchInfo = useCallback(
    (tableId: string, timeInfo?: { day: string; time: number }) => {
      setSearchInfo(timeInfo ? { tableId, ...timeInfo } : { tableId });
    },
    []
  );

  // 검색 다이얼로그 닫기 핸들러 메모이제이션
  const handleCloseSearchDialog = useCallback(() => {
    setSearchInfo(null);
  }, []);

  return (
    <>
      <Flex w="full" gap={6} p={6} flexWrap="wrap">
        {Object.entries(schedulesMap).map(([tableId, schedules], index) => (
          <TableItem
            key={tableId}
            tableId={tableId}
            schedules={schedules}
            index={index}
            disabledRemoveButton={disabledRemoveButton}
            onDuplicate={duplicate}
            onRemove={remove}
            onSetSearchInfo={handleSetSearchInfo}
            onDeleteSchedule={handleDeleteSchedule}
          />
        ))}
      </Flex>
      <SearchDialog searchInfo={searchInfo} onClose={handleCloseSearchDialog} />
    </>
  );
};

// 개별 테이블 아이템 컴포넌트를 분리하여 메모이제이션
const TableItem = memo(
  ({
    tableId,
    schedules,
    index,
    disabledRemoveButton,
    onDuplicate,
    onRemove,
    onSetSearchInfo,
    onDeleteSchedule,
  }: {
    tableId: string;
    schedules: any[];
    index: number;
    disabledRemoveButton: boolean;
    onDuplicate: (tableId: string) => void;
    onRemove: (tableId: string) => void;
    onSetSearchInfo: (
      tableId: string,
      timeInfo?: { day: string; time: number }
    ) => void;
    onDeleteSchedule: (tableId: string, day: string, time: number) => void;
  }) => {
    // 스케줄 시간 클릭 핸들러
    const handleScheduleTimeClick = useCallback(
      (timeInfo: { day: string; time: number }) => {
        onSetSearchInfo(tableId, timeInfo);
      },
      [tableId, onSetSearchInfo]
    );

    // 스케줄 삭제 버튼 클릭 핸들러
    const handleDeleteButtonClick = useCallback(
      ({ day, time }: { day: string; time: number }) => {
        onDeleteSchedule(tableId, day, time);
      },
      [tableId, onDeleteSchedule]
    );

    return (
      <Stack width="600px">
        <Flex justifyContent="space-between" alignItems="center">
          <Heading as="h3" fontSize="lg">
            시간표 {index + 1}
          </Heading>
          <ButtonGroup size="sm" isAttached>
            <Button
              colorScheme="green"
              onClick={() => onSetSearchInfo(tableId)}
            >
              시간표 추가
            </Button>
            <Button
              colorScheme="green"
              mx="1px"
              onClick={() => onDuplicate(tableId)}
            >
              복제
            </Button>
            <Button
              colorScheme="green"
              isDisabled={disabledRemoveButton}
              onClick={() => onRemove(tableId)}
            >
              삭제
            </Button>
          </ButtonGroup>
        </Flex>
        <MemoizedScheduleTable
          schedules={schedules}
          tableId={tableId}
          onScheduleTimeClick={handleScheduleTimeClick}
          onDeleteButtonClick={handleDeleteButtonClick}
        />
      </Stack>
    );
  }
);
