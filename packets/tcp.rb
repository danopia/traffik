#require './packets/tcp'

class TCP
  def initialize packet
    @src, @dest, @seq, @ack, @flags, @window, @sum = packet.unpack('vvVVnvv')
    @header = (@flags>>12) * 4
    @flags &= 0xFFF
    
    options = packet[20..@header-1]
    @cmds = []
    until options.empty?
      case options.bytes.first
        when 1
          options.slice! 0, 1
          @cmds << :nop
        when 2
          size = options.slice!(0, 4)[2..-1].unpack('n').first
          @cmds << [:maxsegmentsize, size]
        when 3
          @cmds << [:windowscale, options.slice!(0, 3).bytes.to_a.last]
        when 4
          options.slice!(0, 2)
          @cmds << :sackpermitted
        when 5
          times = options.slice!(0, 10)[2..-1].unpack('NN')
          @cmds << [:sack, times[0], times[1]]
        when 8
          times = options.slice!(0, 10)[2..-1].unpack('NN')
          @cmds << [:timestamps, times[0], times[1]]
      end
    end
  end
end

