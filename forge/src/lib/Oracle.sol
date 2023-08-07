// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.19;

library Oracle {
    /// @notice Observation is a slot that stores a recorded price
    /// @notice It stores a price, the timestamp when this price was recorded
    /// @notice initialized flag is set to true when the observation is activated
    /// @notice a pool contract can store up to 65535 observations
    struct Observation {
        uint32 timestamp;
        int56 tickCumulative;
        bool initialized;
    }

    /// @notice observationIndex tracks the index of the most recent observation
    /// @notice observationCardinality tracks the number of activated observations
    /// @notice observationCardinalityNext tack the next cardinality the array of obsevations will grow to

    function initialize(
        Observation[65535] storage self,
        uint32 time
    ) internal returns (uint16 cardinality, uint16 cardinalityNext) {
        self[0] = Observation({
            timestamp: time,
            tickCumulative: 0,
            initialized: true
        });

        cardinality = 1;
        cardinalityNext = 1;
    }

    /// @notice write records a new observation for the given time and tick
    /// @notice it returns the index of the observation that was just written
    /// @notice it returns the cardinality and cardinalityNext of the observations array

    function write(
        Observation[65535] storage self,
        uint16 index,
        uint32 timestamp,
        int24 tick,
        uint16 cardinality,
        uint16 cardinalityNext
    ) internal returns (uint16 indexUpdated, uint16 cardinalityUpdated) {
        Observation memory last = self[index];

        if (last.timestamp == timestamp) return (index, cardinality);

        if (cardinalityNext > cardinality && index == (cardinality - 1)) {
            cardinalityUpdated = cardinalityNext;
        } else {
            cardinalityUpdated = cardinality;
        }

        indexUpdated = (index + 1) % cardinalityUpdated;
        self[indexUpdated] = transform(last, timestamp, tick);
    }

    /// @notice grow increases the cardinalityNext of the observations array
    /// @notice it returns the new cardinalityNext

    function grow(
        Observation[65535] storage self,
        uint16 current,
        uint16 next
    ) internal returns (uint16) {
        if (next <= current) return current;

        for (uint16 i = current; i < next; i++) {
            self[i].timestamp = 1;
        }

        return next;
    }

    /// @notice transform calculates a new observation from the previous observation

    function transform(
        Observation memory last,
        uint32 timestamp,
        int24 tick
    ) internal pure returns (Observation memory) {
        uint56 delta = timestamp - last.timestamp;

        return
            Observation({
                timestamp: timestamp,
                tickCumulative: last.tickCumulative +
                    int56(tick) *
                    int56(delta),
                initialized: true
            });
    }

    /// @notice get returns the observation for the given index

    function lte(uint32 time, uint32 a, uint32 b) private pure returns (bool) {
        if (a <= time && b <= time) return a <= b;

        uint256 aAdjusted = a > time ? a : a + 2 ** 32;
        uint256 bAdjusted = b > time ? b : b + 2 ** 32;

        return aAdjusted <= bAdjusted;
    }

    /// @notice get returns the observation for the given index

    function binarySearch(
        Observation[65535] storage self,
        uint32 time,
        uint32 target,
        uint16 index,
        uint16 cardinality
    )
        private
        view
        returns (Observation memory beforeOrAt, Observation memory atOrAfter)
    {
        uint256 l = (index + 1) % cardinality;
        uint256 r = l + cardinality - 1;
        uint256 i;
        while (true) {
            i = (l + r) / 2;

            beforeOrAt = self[i % cardinality];

            if (!beforeOrAt.initialized) {
                l = i + 1;
                continue;
            }

            atOrAfter = self[(i + 1) % cardinality];

            bool targetAtOrAfter = lte(time, beforeOrAt.timestamp, target);

            if (targetAtOrAfter && lte(time, target, atOrAfter.timestamp))
                break;

            if (!targetAtOrAfter) r = i - 1;
            else l = i + 1;
        }
    }

    /// @notice get returns the observation for the given index

    function getSurroundingObservations(
        Observation[65535] storage self,
        uint32 time,
        uint32 target,
        int24 tick,
        uint16 index,
        uint16 cardinality
    )
        private
        view
        returns (Observation memory beforeOrAt, Observation memory atOrAfter)
    {
        beforeOrAt = self[index];

        if (lte(time, beforeOrAt.timestamp, target)) {
            if (beforeOrAt.timestamp == target) {
                return (beforeOrAt, atOrAfter);
            } else {
                return (beforeOrAt, transform(beforeOrAt, target, tick));
            }
        }

        beforeOrAt = self[(index + 1) % cardinality];
        if (!beforeOrAt.initialized) beforeOrAt = self[0];

        require(lte(time, beforeOrAt.timestamp, target), "OLD");

        return binarySearch(self, time, target, index, cardinality);
    }

    /// @notice get returns the observation for the given index
    function observeSingle(
        Observation[65535] storage self,
        uint32 time,
        uint32 secondsAgo,
        int24 tick,
        uint16 index,
        uint16 cardinality
    ) internal view returns (int56 tickCumulative) {
        if (secondsAgo == 0) {
            Observation memory last = self[index];
            if (last.timestamp != time) last = transform(last, time, tick);
            return last.tickCumulative;
        }

        uint32 target = time - secondsAgo;

        (
            Observation memory beforeOrAt,
            Observation memory atOrAfter
        ) = getSurroundingObservations(
                self,
                time,
                target,
                tick,
                index,
                cardinality
            );

        if (target == beforeOrAt.timestamp) {
            return beforeOrAt.tickCumulative;
        } else if (target == atOrAfter.timestamp) {
            return atOrAfter.tickCumulative;
        } else {
            uint56 observationTimeDelta = atOrAfter.timestamp -
                beforeOrAt.timestamp;
            uint56 targetDelta = target - beforeOrAt.timestamp;
            return
                beforeOrAt.tickCumulative +
                ((atOrAfter.tickCumulative - beforeOrAt.tickCumulative) /
                    int56(observationTimeDelta)) *
                int56(targetDelta);
        }
    }

    /// @notice get returns the observation for the given index
    function observe(
        Observation[65535] storage self,
        uint32 time,
        uint32[] memory secondsAgos,
        int24 tick,
        uint16 index,
        uint16 cardinality
    ) internal view returns (int56[] memory tickCumulatives) {
        tickCumulatives = new int56[](secondsAgos.length);

        for (uint256 i = 0; i < secondsAgos.length; i++) {
            tickCumulatives[i] = observeSingle(
                self,
                time,
                secondsAgos[i],
                tick,
                index,
                cardinality
            );
        }
    }
}
