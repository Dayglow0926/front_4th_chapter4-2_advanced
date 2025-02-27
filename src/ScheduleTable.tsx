import {
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverTrigger,
  Text,
} from '@chakra-ui/react';
import { CellSize, DAY_LABELS, 분 } from './constants.ts';
import { Schedule } from './types.ts';
import { fill2, parseHnM } from './utils.ts';
import { useDndContext, useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ComponentProps, Fragment, useCallback, useMemo, memo } from 'react';

interface Props {
  tableId: string;
  schedules: Schedule[];
  onScheduleTimeClick?: (timeInfo: { day: string; time: number }) => void;
  onDeleteButtonClick?: (timeInfo: { day: string; time: number }) => void;
}

// 시간 셀 컴포넌트 분리 및 메모이제이션
const TimeCell = memo(
  ({ time, timeIndex }: { time: string; timeIndex: number }) => {
    return (
      <GridItem
        borderTop="1px solid"
        borderColor="gray.300"
        bg={timeIndex > 17 ? 'gray.200' : 'gray.100'}
      >
        <Flex justifyContent="center" alignItems="center" h="full">
          <Text fontSize="xs">
            {fill2(timeIndex + 1)} ({time})
          </Text>
        </Flex>
      </GridItem>
    );
  }
);

// 요일 헤더 셀 컴포넌트 분리 및 메모이제이션
const DayHeaderCell = memo(({ day }: { day: string }) => {
  return (
    <GridItem key={day} borderLeft="1px" borderColor="gray.300" bg="gray.100">
      <Flex justifyContent="center" alignItems="center" h="full">
        <Text fontWeight="bold">{day}</Text>
      </Flex>
    </GridItem>
  );
});

// 일반 셀 컴포넌트 분리 및 메모이제이션
const DayTimeCell = memo(
  ({
    day,
    timeIndex,
    onScheduleTimeClick,
  }: {
    day: string;
    timeIndex: number;
    onScheduleTimeClick?: (timeInfo: { day: string; time: number }) => void;
  }) => {
    const handleClick = useCallback(() => {
      onScheduleTimeClick?.({ day, time: timeIndex + 1 });
    }, [day, timeIndex, onScheduleTimeClick]);

    return (
      <GridItem
        borderWidth="1px 0 0 1px"
        borderColor="gray.300"
        bg={timeIndex > 17 ? 'gray.100' : 'white'}
        cursor="pointer"
        _hover={{ bg: 'yellow.100' }}
        onClick={handleClick}
      />
    );
  }
);

// 드래그 가능한 스케줄 컴포넌트 메모이제이션
const DraggableSchedule = memo(
  ({
    id,
    data,
    bg,
    onDeleteButtonClick,
  }: { id: string; data: Schedule } & ComponentProps<typeof Box> & {
      onDeleteButtonClick: () => void;
    }) => {
    const { day, range, room, lecture } = data;
    const { attributes, setNodeRef, listeners, transform } = useDraggable({
      id,
    });
    const leftIndex = DAY_LABELS.indexOf(day as (typeof DAY_LABELS)[number]);
    const topIndex = range[0] - 1;
    const size = range.length;

    return (
      <Popover>
        <PopoverTrigger>
          <Box
            position="absolute"
            left={`${120 + CellSize.WIDTH * leftIndex + 1}px`}
            top={`${40 + (topIndex * CellSize.HEIGHT + 1)}px`}
            width={CellSize.WIDTH - 1 + 'px'}
            height={CellSize.HEIGHT * size - 1 + 'px'}
            bg={bg}
            p={1}
            boxSizing="border-box"
            cursor="pointer"
            ref={setNodeRef}
            transform={CSS.Translate.toString(transform)}
            {...listeners}
            {...attributes}
          >
            <Text fontSize="sm" fontWeight="bold">
              {lecture.title}
            </Text>
            <Text fontSize="xs">{room}</Text>
          </Box>
        </PopoverTrigger>
        <PopoverContent onClick={(event) => event.stopPropagation()}>
          <PopoverArrow />
          <PopoverCloseButton />
          <PopoverBody>
            <Text>강의를 삭제하시겠습니까?</Text>
            <Button colorScheme="red" size="xs" onClick={onDeleteButtonClick}>
              삭제
            </Button>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    );
  }
);

// 드래그 상태 추적 컴포넌트 분리
const DragStateTracker = memo(({ tableId }: { tableId: string }) => {
  const dndContext = useDndContext();

  const activeTableId = useMemo(() => {
    const activeId = dndContext.active?.id;
    if (activeId) {
      return String(activeId).split(':')[0];
    }
    return null;
  }, [dndContext.active?.id]);

  const isActive = activeTableId === tableId;

  return (
    <Box
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      pointerEvents="none"
      outline={isActive ? '5px dashed' : undefined}
      outlineColor="blue.300"
      zIndex={10}
    />
  );
});

const ScheduleTable = memo(
  ({ tableId, schedules, onScheduleTimeClick, onDeleteButtonClick }: Props) => {
    const getColor = useCallback(
      (lectureId: string): string => {
        const lectures = [
          ...new Set(schedules.map(({ lecture }) => lecture.id)),
        ];
        const colors = ['#fdd', '#ffd', '#dff', '#ddf', '#fdf', '#dfd'];
        return colors[lectures.indexOf(lectureId) % colors.length];
      },
      [schedules]
    );

    const times = useMemo(
      () => [
        ...Array(18)
          .fill(0)
          .map((v, k) => v + k * 30 * 분)
          .map((v) => `${parseHnM(v)}~${parseHnM(v + 30 * 분)}`),

        ...Array(6)
          .fill(18 * 30 * 분)
          .map((v, k) => v + k * 55 * 분)
          .map((v) => `${parseHnM(v)}~${parseHnM(v + 50 * 분)}`),
      ],
      []
    );

    const handleDeleteButtonClick = useCallback(
      (schedule: Schedule) => {
        onDeleteButtonClick?.({
          day: schedule.day,
          time: schedule.range[0],
        });
      },
      [onDeleteButtonClick]
    );

    return (
      <Box position="relative">
        <Grid
          templateColumns={`120px repeat(${DAY_LABELS.length}, ${CellSize.WIDTH}px)`}
          templateRows={`40px repeat(${times.length}, ${CellSize.HEIGHT}px)`}
          bg="white"
          fontSize="sm"
          textAlign="center"
          outline="1px solid"
          outlineColor="gray.300"
        >
          <GridItem key="교시" borderColor="gray.300" bg="gray.100">
            <Flex justifyContent="center" alignItems="center" h="full" w="full">
              <Text fontWeight="bold">교시</Text>
            </Flex>
          </GridItem>

          {DAY_LABELS.map((day) => (
            <DayHeaderCell key={day} day={day} />
          ))}

          {times.map((time, timeIndex) => (
            <Fragment key={`시간-${timeIndex + 1}`}>
              <TimeCell time={time} timeIndex={timeIndex} />

              {DAY_LABELS.map((day) => (
                <DayTimeCell
                  key={`${day}-${timeIndex + 2}`}
                  day={day}
                  timeIndex={timeIndex}
                  onScheduleTimeClick={onScheduleTimeClick}
                />
              ))}
            </Fragment>
          ))}
        </Grid>

        {schedules.map((schedule, index) => (
          <DraggableSchedule
            key={`${schedule.lecture.title}-${index}`}
            id={`${tableId}:${index}`}
            data={schedule}
            bg={getColor(schedule.lecture.id)}
            onDeleteButtonClick={() => handleDeleteButtonClick(schedule)}
          />
        ))}

        <DragStateTracker tableId={tableId} />
      </Box>
    );
  }
);

export default ScheduleTable;
